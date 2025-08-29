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
    Gets token using JWT
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        raise APIException('Authentication failed', status_code=404)
    return user

def get_object_or_404(model, object_id, not_found_message):
    obj = model.query.get(object_id)
    if not obj:
        raise APIException(not_found_message, status_code=404)
    return obj

def require_body_fields(body, fields):
    """
    Checks if the required fields are present in the request body.
    """
    for field in fields:
        if not body.get(field):
            raise APIException(f'{field} is required', status_code=400)

@api.route('/register', methods=['POST'])
def register():
    body = request.get_json()
    name = body.get('name')
    user_name = body.get('user_name')
    email = body.get('email')
    password = generate_password_hash(body.get('password')) 
    birth_date = body.get('birth_date')
    location = body.get('location')
    role = body.get('role') 

    require_body_fields(body, ['name', 'user_name', 'email', 'password', 'birth_date'])
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        raise APIException('Email already in use', status_code=400)
    existing_user = User.query.filter_by(user_name=user_name).first()
    if existing_user:
            raise APIException('Username already in use', status_code=400)

    try:
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email=email, password=password, user_name=user_name, birth_date=birth_date, name=name, location=location, role=role)
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise APIException(e, status_code=500)

    return jsonify({'message': 'User registered successfully', 'user': user.serialize()}), 201

@api.route('/login', methods=['POST'])
def login():
    body = request.get_json()
    user_name = body.get('user_name')
    email = body.get('email')
    password = body.get('password')

    if not (email or user_name) or not password:
        raise APIException('Email or user_name and password are required', status_code=400)
    user = User.query.filter_by(email=email).first() or User.query.filter_by(user_name=user_name).first()
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
    Get the current user's profile information.
    Returns the user's data.
    Requires authentication.
    """
    user = get_authenticated_user()

    return jsonify(user.serialize()), 200

@api.route('/myProfile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update the current user's profile information.
    Returns a success message.
    Requires authentication.
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
    Get the user's favorites.
    Returns a list of favorite POIs with all their details.
    Requires authentication.
    """
    user = get_authenticated_user()

    try:
        favorites = user.favorites
        return jsonify({'favorites': [Poi.query.get(fav.poi_id).serialize() for fav in favorites]}), 200
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/favorites', methods=['POST'])
@jwt_required()
def add_favorite():
    """
    Add a favorite POI to the current user.
    Returns a success message.
    Requires authentication.
    """
    user = get_authenticated_user()

    body = request.get_json()
    poi_id = body.get('poi_id')

    require_body_fields(body, ['poi_id'])
    poi = Poi.query.get(poi_id)
    get_object_or_404(Poi, poi_id, 'Point of interest not found')

    existing_favorite = Favorite.query.filter_by(user_id=user.id, poi_id=poi.id).first()
    if existing_favorite:
        raise APIException('Point of interest is already in favorites', status_code=400)

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
    Remove a favorite POI from the current user.
    Returns a success message.
    Requires authentication.
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
    Get all points of interest.
    Returns a list of all POIs with their details.
    """
    try:
        pois = Poi.query.all()
        if pois:
            return jsonify([poi.serialize() for poi in pois]), 200
        else:
            raise APIException("No points of interest found", status_code=404)
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/pois/<string:poi_id>', methods=['GET'])
def get_poi(poi_id):
    """
    Get a specific point of interest by its ID.
    Returns the POI details.
    """
    try:
        poi = Poi.query.get(poi_id)
        if poi:
            return jsonify(poi.serialize()), 200
        else:
            raise APIException("Point of interest not found", status_code=404)
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/pois/search/<string:poi_name>', methods=['GET'])
def get_poi_by_name(poi_name):
    """
    Search points of interest by name.
    Returns details of all POIs that contain poi_name in their name.
    """
    try:
        pois = Poi.query.filter(Poi.name.ilike(f'%{poi_name}%')).all()
        if pois:
            return jsonify([poi.serialize() for poi in pois]), 200
        else:
            raise APIException("No points of interest found", status_code=404)
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/pois', methods=['POST'])
def create_poi():
    """
    Create one or more new points of interest.
    Returns the created POIs details.
    """
    body = request.get_json()
    if isinstance(body, dict):
        items = [body]
    elif isinstance(body, list):
        if len(body) == 0:
            raise APIException('Input list cannot be empty', status_code=400)
        items = body
    else:
        raise APIException('Invalid input format', status_code=400)

    created = []
    for item in items:
        name = item.get('name')
        description = item.get('description')
        latitude = item.get('latitude')
        longitude = item.get('longitude')
        img = item.get('img')
        city_id = item.get('city_id')

        require_body_fields(item, ['name', 'description', 'latitude', 'longitude', 'city_id'])
        get_object_or_404(City, city_id, 'City not found')
        id = str(uuid.uuid4())
        poi = Poi(id=id, name=name, description=description, latitude=latitude, longitude=longitude, img=img, city_id=city_id)
        created.append(poi)

    try:
        db.session.add_all(created)
        db.session.commit()
        return jsonify({'message': 'Points of interest created successfully', 'created': [poi.serialize() for poi in created]}), 201
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/pois/<string:poi_id>', methods=['PUT'])
def edit_poi(poi_id):
    """
    Edit an existing point of interest.
    Returns the updated POI details.
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
        return jsonify({'message': 'Point of interest updated successfully', 'poi': poi.serialize()}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/pois/<string:poi_id>', methods=['DELETE'])
def delete_poi(poi_id):
    """
    Delete an existing point of interest.
    Returns a message indicating the deletion status.
    """
    poi = get_object_or_404(Poi, poi_id, 'Point of interest not found')

    try:
        db.session.delete(poi)
        db.session.commit()
        return jsonify({'message': 'Point of interest deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)
    
@api.route('/countries', methods=['GET'])
def get_countries():
    """
    Get a list of all countries.
    """
    try:
        countries = Country.query.all()
        if countries:
            return jsonify([country.serialize() for country in countries]), 200
        else:
            raise APIException("No countries found", status_code=404)
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/countries/<string:country_id>', methods=['GET'])
def get_country(country_id):
    """
    Get a single country by ID.
    """
    try:
        country = Country.query.get(country_id)
        if country:
            return jsonify(country.serialize()), 200
        else:
            return jsonify({'message': 'Country not found'}), 404
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/countries/search/<string:country_name>', methods=['GET'])
def get_country_by_name(country_name):
    """
    Search countries by name.
    Returns details of all countries that contain country_name in their name.
    """
    try:
        countries = Country.query.filter(Country.name.ilike(f'%{country_name}%')).all()
        if countries:
            return jsonify([country.serialize() for country in countries]), 200
        else:
            return jsonify({'message': 'No countries found'}), 404
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/countries', methods=['POST'])
def create_country():
    """
    Create a new country.
    Returns the created country.
    """
    body = request.get_json()
    if isinstance(body, dict):
        items = [body]
    elif isinstance(body, list):
        if len(body) == 0:
            raise APIException('Input list cannot be empty', status_code=400)
        items = body
    else:
        raise APIException('Invalid input format', status_code=400)

    created = []
    for item in items:
        name = item.get('name')
        img = item.get('img')

        require_body_fields(item, ['name', 'img'])
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
    Edit an existing country.
    Returns the edited country
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
    try:
        cities = City.query.all()
        if cities:
            return jsonify([city.serialize() for city in cities]), 200
        else:
            return jsonify({'message': 'No cities found'}), 404
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/cities/<string:city_id>', methods=['GET'])
def get_city(city_id):
    """
    Get a city by ID.
    """
    try:
        city = City.query.get(city_id)
        if city:
            return jsonify(city.serialize()), 200
        else:
            return jsonify({'message': 'City not found'}), 404
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/cities/search/<string:city_name>', methods=['GET'])
def get_city_by_name(city_name):
    """
    Get a city by name.
    Returns details of all cities containing city_name
    """
    try:
        city = City.query.filter(City.name.ilike(f'%{city_name}%')).all()
        if city:
            return jsonify([c.serialize() for c in city]), 200
        else:
            return jsonify({'message': 'No city found'}), 404
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/cities', methods=['POST'])
def create_city():
    """
    Create a new city.
    Returns the created city.
    """
    body = request.get_json()
    if isinstance(body, dict):
        items = [body]
    elif isinstance(body, list):
        if len(body) == 0:
            raise APIException('Input list cannot be empty', status_code=400)
        items = body
    else:
        raise APIException('Invalid input format', status_code=400)

    created = []
    for item in items:
        name = item.get('name')
        img = item.get('img')
        climate = item.get('climate')
        country_id = item.get('country_id')
        
        require_body_fields(item, ['name', 'img', 'climate', 'country_id'])
        get_object_or_404(Country, country_id, 'Country not found')
        id = str(uuid.uuid4())
        city = City(id=id, name=name, img=img, climate=climate, country_id=country_id)
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
    Edit an existing city.
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
    Get details of a list of popular points of interest. (20 random POIs)
    """
    try:
        pois = Poi.query.order_by(db.func.random()).limit(20).all()
        if pois:
            return jsonify([poi.serialize() for poi in pois]), 200
        else:
            return jsonify({'message': 'No points of interest found'}), 404
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/visited', methods=['GET'])
@jwt_required()
def get_visited_pois():
    """
    Get a list of visited POIs.
    Requires authentication.
    """
    user = get_authenticated_user()

    try:
        visited = Visited.query.filter_by(user_id=user.id).all()
        if visited:
            return jsonify([Poi.query.get(v.poi_id).serialize() for v in visited]), 200
        else:
            return jsonify({'message': 'No visited POIs found'}), 404
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/visited', methods=['POST'])
@jwt_required()
def add_visited_poi():
    """
    Add a POI to the visited list.
    """
    user = get_authenticated_user()

    body = request.get_json()
    poi_id = body.get('poi_id')
    require_body_fields(body, ['poi_id'])
    poi = get_object_or_404(Poi, poi_id, 'POI not found')

    existing_visited = Visited.query.filter_by(user_id=user.id, poi_id=poi.id).first()
    if existing_visited:
        raise APIException('POI already visited', status_code=400)

    visited = Visited(poi_id=poi.id, user_id=user.id)

    try:
        db.session.add(visited)
        db.session.commit()
        return jsonify({'message': 'POI added to visited list', 'POI': poi.serialize()}), 201
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/visited', methods=['DELETE'])
@jwt_required()
def delete_visited_poi():
    """
    Remove a POI from the visited list.
    """
    body = request.get_json()
    poi_id = body.get('poi_id')

    user = get_authenticated_user()
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
