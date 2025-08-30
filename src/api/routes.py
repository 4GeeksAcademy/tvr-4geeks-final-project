from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Poi, Country, City, Favorite, Visited, PoiImage, Tag
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


def get_authenticated_user():
    """
        Retrieve the authenticated user from the JWT token.
    Raises:
        APIException: If authentication fails or user does not exist.
    Returns:
        User: The authenticated user object.
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        raise APIException('Authentication failed', status_code=404)
    return user


def get_object_or_404(model, object_id, not_found_message):
    """
    Retrieve an object by its ID from the database.
    Args:
        model: The SQLAlchemy model class.
        object_id: The object's primary key.
        not_found_message: Error message if not found.
    Raises:
        APIException: If the object does not exist.
    Returns:
        db.Model: The found object.
    """
    obj = model.query.get(object_id)
    if not obj:
        raise APIException(not_found_message, status_code=404)
    return obj


def require_body_fields(body, fields):
    """
    Ensure that all required fields are present in the request body.
    Args:
        body: The request body (dict).
        fields: List of required field names.
    Raises:
        APIException: If any required field is missing.
    """
    for field in fields:
        if not body.get(field):
            raise APIException(f'{field} is required', status_code=400)


def get_all_serialized(model, not_found_message):
    """
    Retrieve and serialize all objects of a model.
    Args:
        model: The SQLAlchemy model class.
        not_found_message: Error message if none found.
    Raises:
        APIException: If no objects are found.
    Returns:
        Response: JSON list of serialized objects.
    """
    items = model.query.all()
    if items:
        return jsonify([item.serialize() for item in items]), 200
    else:
        raise APIException(not_found_message, status_code=404)


def search_by_name_serialized(model, name_field, search_value, not_found_message):
    """
    Search and serialize objects by a name field.
    Args:
        model: The SQLAlchemy model class.
        name_field: The field to search by (str).
        search_value: The value to search for (str).
        not_found_message: Error message if none found.
    Raises:
        APIException: If no objects are found.
    Returns:
        Response: JSON list of serialized objects.
    """
    filter_expr = getattr(model, name_field).ilike(f'%{search_value}%')
    items = model.query.filter(filter_expr).all()
    if items:
        return jsonify([item.serialize() for item in items]), 200
    else:
        raise APIException(not_found_message, status_code=404)


def normalize_body_to_list(body):
    """
    Normalize the request body to a list.
    Args:
        body: The request body (dict or list).
    Raises:
        APIException: If the input is invalid or the list is empty.
    Returns:
        list: The normalized list of items.
    """
    if isinstance(body, dict):
        return [body]
    elif isinstance(body, list):
        if len(body) == 0:
            raise APIException('Input list cannot be empty', status_code=400)
        return body
    else:
        raise APIException('Invalid input format', status_code=400)


@api.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    Args:
        None (expects JSON body with user data).
    Raises:
        APIException: If required fields are missing or user/email already exists.
    Returns:
        Response: JSON with the created user or error message.
    """
    body = request.get_json()
    name = body.get('name')
    user_name = body.get('user_name')
    email = body.get('email')
    password = generate_password_hash(body.get('password'))
    birth_date = body.get('birth_date')
    location = body.get('location')
    role = body.get('role')

    require_body_fields(
        body, ['name', 'user_name', 'email', 'password', 'birth_date'])
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        raise APIException('Email already in use', status_code=400)
    existing_user = User.query.filter_by(user_name=user_name).first()
    if existing_user:
        raise APIException('Username already in use', status_code=400)

    try:
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email=email, password=password, user_name=user_name,
                    birth_date=birth_date, name=name, location=location, role=role)
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise APIException(e, status_code=500)

    return jsonify({'message': 'User registered successfully', 'user': user.serialize()}), 201


@api.route('/login', methods=['POST'])
def login():
    """
    Log in a user.
    Args:
        None (expects JSON body with credentials).
    Raises:
        APIException: If credentials are missing or invalid.
    Returns:
        Response: JSON with access token or error message.
    """
    body = request.get_json()
    user_name = body.get('user_name')
    email = body.get('email')
    password = body.get('password')

    if not (email or user_name) or not password:
        raise APIException(
            'Email or user_name and password are required', status_code=400)
    user = User.query.filter_by(email=email).first(
    ) or User.query.filter_by(user_name=user_name).first()
    if not user:
        raise APIException('Invalid email or user_name', status_code=401)
    if not check_password_hash(user.password, password):
        raise APIException('Invalid password', status_code=401)

    access_token = create_access_token(identity=user.id)
    return jsonify({'message': 'Login successful', 'access_token': access_token}), 200


@api.route('/myProfile', methods=['GET'])
@jwt_required()
def my_profile():
    """
    Retrieve the authenticated user's profile.
    Args:
        None.
    Raises:
        APIException: If authentication fails.
    Returns:
        Response: JSON with user data.
    """
    user = get_authenticated_user()
    return jsonify(user.serialize()), 200


@api.route('/myProfile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update the authenticated user's profile.
    Args:
        None (expects JSON body with fields to update).
    Raises:
        APIException: If authentication fails or data is invalid.
    Returns:
        Response: JSON with updated user or error message.
    """
    user = get_authenticated_user()
    body = request.get_json()
    user_name = body.get('user_name')
    email = body.get('email')
    location = body.get('location')
    password = body.get('password')

    if email and len(email) > 0:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user and existing_user.id != user.id:
            raise APIException('Email already in use', status_code=400)
        user.email = email
    if user_name and len(user_name) > 0:
        existing_user = User.query.filter_by(user_name=user_name).first()
        if existing_user and existing_user.id != user.id:
            raise APIException('Username already in use', status_code=400)
        user.user_name = user_name
    if password and len(password) > 0:
        user.password = generate_password_hash(password)
    if location and len(location) > 0:
        user.location = location

    try:
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully', 'user': user.serialize()}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/favorites', methods=['GET'])
@jwt_required()
def favorites():
    """
    Retrieve the authenticated user's favorite POIs.
    Args:
        None.
    Raises:
        APIException: If authentication fails or no favorites found.
    Returns:
        Response: JSON list of favorite POIs.
    """
    user = get_authenticated_user()

    try:
        favorites = Favorite.query.filter_by(user_id=user.id).all()
        if not favorites:
            raise APIException(
                "No favorites found for this user", status_code=404)
        return jsonify([f.serialize() for f in favorites]), 200
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/favorites', methods=['POST'])
@jwt_required()
def add_favorite():
    """
    Add a POI to the authenticated user's favorites.
    Args:
        None (expects JSON body with poi_id).
    Raises:
        APIException: If authentication fails, required fields are missing, POI not found, or already in favorites.
    Returns:
        Response: JSON with added favorite or error message.
    """
    user = get_authenticated_user()
    body = request.get_json()
    poi_id = body.get('poi_id')

    require_body_fields(body, ['poi_id'])
    poi = get_object_or_404(Poi, poi_id, 'Point of interest not found')

    existing_favorite = Favorite.query.filter_by(
        user_id=user.id, poi_id=poi.id).first()
    if existing_favorite:
        raise APIException(
            'Point of interest is already in favorites', status_code=400)

    try:
        favorite = Favorite(user=user, poi=poi)
        db.session.add(favorite)
        db.session.commit()
        return jsonify({'message': 'Favorite added successfully', 'favorite': favorite.serialize()}), 201
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/favorites', methods=['DELETE'])
@jwt_required()
def remove_favorite():
    """
    Remove a POI from the authenticated user's favorites.
    Args:
        None (expects JSON body with poi_id).
    Raises:
        APIException: If authentication fails, required fields are missing, or favorite not found.
    Returns:
        Response: JSON with success or error message.
    """
    user = get_authenticated_user()
    body = request.get_json()
    poi_id = body.get('poi_id')

    require_body_fields(body, ['poi_id'])
    favorite = Favorite.query.filter_by(user_id=user.id, poi_id=poi_id).first()
    if not favorite:
        raise APIException('Favorite not found', status_code=404)

    try:
        db.session.delete(favorite)
        db.session.commit()
        return jsonify({'message': 'Favorite removed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/pois', methods=['GET'])
def get_pois():
    """
    Retrieve all points of interest (POIs).
    Args:
        None.
    Raises:
        APIException: If no POIs are found.
    Returns:
        Response: JSON list of POIs.
    """
    try:
        return get_all_serialized(Poi, 'No points of interest found')
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/pois/<string:poi_id>', methods=['GET'])
def get_poi(poi_id):
    """
    Retrieve details of a POI by its ID.
    Args:
        poi_id (str): The POI's ID.
    Raises:
        APIException: If POI not found.
    Returns:
        Response: JSON with POI details.
    """
    try:
        poi = get_object_or_404(Poi, poi_id, 'Point of interest not found')
        return jsonify(poi.serialize()), 200
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/pois/search/<string:poi_name>', methods=['GET'])
def get_poi_by_name(poi_name):
    """
    Search POIs by name.
    Args:
        poi_name (str): Name or partial name to search.
    Raises:
        APIException: If no POIs are found.
    Returns:
        Response: JSON list of matching POIs.
    """
    try:
        return search_by_name_serialized(Poi, 'name', poi_name, 'No points of interest found')
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/pois', methods=['POST'])
def create_poi():
    """
    Create one or more points of interest (POIs).
    Args:
        None (expects JSON body with POI data).
    Raises:
        APIException: If required fields are missing or city not found.
    Returns:
        Response: JSON with created POIs or error message.
    """
    body = request.get_json()
    items = normalize_body_to_list(body)

    created = []
    for item in items:
        name = item.get('name')
        description = item.get('description')
        latitude = item.get('latitude')
        longitude = item.get('longitude')
        city_id = item.get('city_id')

        require_body_fields(
            item, ['name', 'description', 'latitude', 'longitude', 'city_id'])
        get_object_or_404(City, city_id, 'City not found')
        existing_poi = Poi.query.filter_by(name=name, city_id=city_id).first()
        if existing_poi:
            raise APIException(f"POI with name '{name}' already exists in city ID {city_id}", status_code=400)
        id = str(uuid.uuid4())
        poi = Poi(id=id, name=name, description=description,
                  latitude=latitude, longitude=longitude, city_id=city_id)
        created.append(poi)

    try:
        db.session.add_all(created)
        db.session.commit()
        return jsonify({'message': 'POIs created successfully', 'created': [poi.serialize() for poi in created]}), 201
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/pois/<string:poi_id>', methods=['PUT'])
def edit_poi(poi_id):
    """
    Update an existing POI.
    Args:
        poi_id (str): The POI's ID. Expects JSON body with fields to update.
    Raises:
        APIException: If required fields are missing or POI/city not found.
    Returns:
        Response: JSON with updated POI or error message.
    """
    body = request.get_json()
    name = body.get('name')
    description = body.get('description')
    latitude = body.get('latitude')
    longitude = body.get('longitude')
    img = body.get('img')
    city_id = body.get('city_id')

    require_body_fields(body, ['poi_id'])
    poi = get_object_or_404(Poi, poi_id, 'Point of interest not found')
    if city_id:
        get_object_or_404(City, city_id, 'City not found')

    if name:
        poi.name = name
    if description:
        poi.description = description
    if latitude:
        poi.latitude = latitude
    if longitude:
        poi.longitude = longitude
    if img:
        poi.img = img
    if city_id:
        poi.city_id = city_id

    try:
        db.session.commit()
        return jsonify({'message': 'POI updated successfully', 'poi': poi.serialize()}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/pois/<string:poi_id>', methods=['DELETE'])
def delete_poi(poi_id):
    """
    Delete an existing POI.
    Args:
        poi_id (str): The POI's ID.
    Raises:
        APIException: If POI not found.
    Returns:
        Response: JSON with success or error message.
    """
    poi = get_object_or_404(Poi, poi_id, 'Point of interest not found')

    try:
        db.session.delete(poi)
        db.session.commit()
        return jsonify({'message': 'POI deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/countries', methods=['GET'])
def get_countries():
    """
    Retrieve all countries.
    Args:
        None.
    Raises:
        APIException: If no countries are found.
    Returns:
        Response: JSON list of countries.
    """
    try:
        return get_all_serialized(Country, 'No countries found')
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/countries/<string:country_id>', methods=['GET'])
def get_country(country_id):
    """
    Retrieve details of a country by its ID.
    Args:
        country_id (str): The country's ID.
    Raises:
        APIException: If country not found.
    Returns:
        Response: JSON with country details.
    """
    try:
        country = get_object_or_404(Country, country_id, 'Country not found')
        return jsonify(country.serialize()), 200
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/countries/search/<string:country_name>', methods=['GET'])
def get_country_by_name(country_name):
    """
    Search countries by name.
    Args:
        country_name (str): Name or partial name to search.
    Raises:
        APIException: If no countries are found.
    Returns:
        Response: JSON list of matching countries.
    """
    try:
        return search_by_name_serialized(Country, 'name', country_name, 'No countries found')
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/countries', methods=['POST'])
def create_country():
    """
    Create one or more countries.
    Args:
        None (expects JSON body with country data).
    Raises:
        APIException: If required fields are missing.
    Returns:
        Response: JSON with created countries or error message.
    """
    body = request.get_json()
    items = normalize_body_to_list(body)

    created = []
    for item in items:
        name = item.get('name')
        img = item.get('img')

        require_body_fields(item, ['name', 'img'])
        existing_country = Country.query.filter_by(name=name).first()
        if existing_country:
            raise APIException(f"Country with name '{name}' already exists", status_code=400)
        id = str(uuid.uuid4())
        country = Country(id=id, name=name, img=img)
        created.append(country)
    try:
        db.session.add_all(created)
        db.session.commit()
        return jsonify({'message': 'Countries created successfully', 'created': [country.serialize() for country in created]}), 201
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/countries/<string:country_id>', methods=['PUT'])
def edit_country(country_id):
    """
    Update an existing country.
    Args:
        country_id (str): The country's ID. Expects JSON body with fields to update.
    Raises:
        APIException: If country not found.
    Returns:
        Response: JSON with updated country or error message.
    """
    body = request.get_json()
    name = body.get('name')
    img = body.get('img')

    country = get_object_or_404(Country, country_id, 'Country not found')

    if name:
        country.name = name
    if img:
        country.img = img
    try:
        db.session.commit()
        return jsonify({'message': 'Country updated successfully', 'country': country.serialize()}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/countries/<string:country_id>', methods=['DELETE'])
def delete_country(country_id):
    """
    Delete an existing country.
    Args:
        country_id (str): The country's ID.
    Raises:
        APIException: If country not found.
    Returns:
        Response: JSON with success or error message.
    """
    country = get_object_or_404(Country, country_id, 'Country not found')

    try:
        db.session.delete(country)
        db.session.commit()
        return jsonify({'message': 'Country deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/cities', methods=['GET'])
def get_cities():
    """
    Retrieve all cities.
    Args:
        None.
    Raises:
        APIException: If no cities are found.
    Returns:
        Response: JSON list of cities.
    """
    try:
        return get_all_serialized(City, 'No cities found')
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/cities/<string:city_id>', methods=['GET'])
def get_city(city_id):
    """
    Retrieve details of a city by its ID.
    Args:
        city_id (str): The city's ID.
    Raises:
        APIException: If city not found.
    Returns:
        Response: JSON with city details.
    """
    try:
        city = get_object_or_404(City, city_id, 'City not found')
        return jsonify(city.serialize()), 200
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/cities/search/<string:city_name>', methods=['GET'])
def get_city_by_name(city_name):
    """
    Search cities by name.
    Args:
        city_name (str): Name or partial name to search.
    Raises:
        APIException: If no cities are found.
    Returns:
        Response: JSON list of matching cities.
    """
    try:
        return search_by_name_serialized(City, 'name', city_name, 'No cities found')
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/cities', methods=['POST'])
def create_city():
    """
    Create one or more cities.
    Args:
        None (expects JSON body with city data).
    Raises:
        APIException: If required fields are missing or country not found.
    Returns:
        Response: JSON with created cities or error message.
    """
    body = request.get_json()
    items = normalize_body_to_list(body)

    created = []
    for item in items:
        name = item.get('name')
        img = item.get('img')
        climate = item.get('climate')
        country_id = item.get('country_id')

        require_body_fields(item, ['name', 'img', 'climate', 'country_id'])
        get_object_or_404(Country, country_id, 'Country not found')
        existing_city = City.query.filter_by(name=name, country_id=country_id).first()
        if existing_city:
            raise APIException(f"City with name '{name}' already exists in country ID {country_id}", status_code=400)
        id = str(uuid.uuid4())
        city = City(id=id, name=name, img=img,
                    climate=climate, country_id=country_id)
        created.append(city)

    try:
        db.session.add_all(created)
        db.session.commit()
        return jsonify({'message': 'Cities created successfully', 'created': [city.serialize() for city in created]}), 201
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/cities/<string:city_id>', methods=['PUT'])
def edit_city(city_id):
    """
    Update an existing city.
    Args:
        city_id (str): The city's ID. Expects JSON body with fields to update.
    Raises:
        APIException: If city or country not found.
    Returns:
        Response: JSON with updated city or error message.
    """
    body = request.get_json()
    name = body.get('name')
    img = body.get('img')
    climate = body.get('climate')
    country_id = body.get('country_id')

    city = get_object_or_404(City, city_id, 'City not found')
    if country_id:
        get_object_or_404(Country, country_id, 'Country not found')

    if name:
        city.name = name
    if img:
        city.img = img
    if climate:
        city.climate = climate
    if country_id:
        city.country_id = country_id

    try:
        db.session.commit()
        return jsonify({'message': 'City updated successfully', 'city': city.serialize()}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/cities/<string:city_id>', methods=['DELETE'])
def delete_city(city_id):
    """
    Delete an existing city.
    Args:
        city_id (str): The city's ID.
    Raises:
        APIException: If city not found.
    Returns:
        Response: JSON with success or error message.
    """
    city = get_object_or_404(City, city_id, 'City not found')

    try:
        db.session.delete(city)
        db.session.commit()
        return jsonify({'message': 'City deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/popular-pois', methods=['GET'])
def get_popular_pois():
    """
    Retrieve a random list of 20 popular POIs.
    Args:
        None.
    Raises:
        APIException: If no POIs are found.
    Returns:
        Response: JSON list of POIs.
    """
    try:
        pois = Poi.query.order_by(db.func.random()).limit(20).all()
        if pois:
            return jsonify([poi.serialize() for poi in pois]), 200
        else:
            return jsonify({'message': 'No points of interest found'}), 404
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/visited', methods=['GET'])
@jwt_required()
def get_visited_pois():
    """
    Retrieve the authenticated user's visited POIs.
    Args:
        None.
    Raises:
        APIException: If authentication fails or no visited POIs found.
    Returns:
        Response: JSON list of visited POIs.
    """
    user = get_authenticated_user()

    try:
        visited = Visited.query.filter_by(user_id=user.id).all()
        if visited:
            return jsonify([Poi.query.get(v.poi_id).serialize() for v in visited]), 200
        else:
            return jsonify({'message': 'No visited POIs found'}), 404
    except Exception as e:
        if isinstance(e, APIException):
            raise
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/visited', methods=['POST'])
@jwt_required()
def add_visited_poi():
    """
    Add a POI to the authenticated user's visited list.
    Args:
        None (expects JSON body with poi_id).
    Raises:
        APIException: If authentication fails, required fields are missing, POI not found, or already visited.
    Returns:
        Response: JSON with added POI or error message.
    """
    user = get_authenticated_user()

    body = request.get_json()
    poi_id = body.get('poi_id')
    require_body_fields(body, ['poi_id'])
    poi = get_object_or_404(Poi, poi_id, 'POI not found')

    existing_visited = Visited.query.filter_by(
        user_id=user.id, poi_id=poi.id).first()
    if existing_visited:
        raise APIException('POI already visited', status_code=400)

    visited = Visited(poi_id=poi.id, user_id=user.id)

    try:
        db.session.add(visited)
        db.session.commit()
        return jsonify({'message': 'POI added to visited list', 'poi': poi.serialize()}), 201
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)


@api.route('/visited', methods=['DELETE'])
@jwt_required()
def delete_visited_poi():
    """
    Remove a POI from the authenticated user's visited list.
    Args:
        None (expects JSON body with poi_id).
    Raises:
        APIException: If authentication fails, required fields are missing, or visited POI not found.
    Returns:
        Response: JSON with success or error message.
    """
    user = get_authenticated_user()
    body = request.get_json()
    poi_id = body.get('poi_id')

    require_body_fields(body, ['poi_id'])
    visited = Visited.query.filter_by(user_id=user.id, poi_id=poi_id).first()
    if not visited:
        raise APIException('Visited POI not found', status_code=404)

    try:
        db.session.delete(visited)
        db.session.commit()
        return jsonify({'message': 'POI removed from visited list'}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)
