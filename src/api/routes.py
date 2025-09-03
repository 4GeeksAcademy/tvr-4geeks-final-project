from flask import Flask, request, jsonify, url_for, Blueprint, current_app
from api.models import db, User, Poi, Country, City, Favorite, Visited, PoiImage, Tag, PoiTag
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy.exc import IntegrityError
import uuid

api = Blueprint('api', __name__)
CORS(api)


def handle_unexpected_error(context: str):
    """
    Log unexpected exceptions and raise a standardized APIException.
    Args:
        context (str): Description of the operation where the error occurred.
    Raises:
        APIException: A generic error message with a 500 status code.
    """
    current_app.logger.exception(context)
    raise APIException(
        f"An unexpected error occurred while {context}", status_code=500)


def require_json_object(body, context: str):
    """
    Ensure the request body is a JSON object (dict).
    Args:
        body: The request body.
        context (str): Description of the operation for error context.
    Raises:
        APIException: If the body is not a JSON object.
    Returns:
        dict: The validated JSON object.
    """
    if body is None or not isinstance(body, dict):
        raise APIException(
            f"{context} body must be a JSON object", status_code=400)
    return body


def get_authenticated_user():
    """
    Retrieve the authenticated user from the JWT token.
    Raises:
        APIException: If authentication fails or the user does not exist.
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
        model: The SQLAlchemy model class to query.
        object_id: The primary key of the object to retrieve.
        not_found_message: The error message to return if the object is not found.
    Raises:
        APIException: If the object does not exist.
    Returns:
        db.Model: The retrieved object.
    """
    obj = model.query.get(object_id)
    if not obj:
        raise APIException(not_found_message, status_code=404)
    return obj


def require_body_fields(body, fields, item_name=None):
    """
    Ensure that the request body contains exactly the required fields.
    Args:
        body: The request body (dict).
        fields: A list of required field names.
        item_name: Optional. The name of the item being validated.
    Raises:
        APIException: If any required field is missing or if there are extra fields.
    """
    missing_fields = [field for field in fields if field not in body]
    extra_fields = [field for field in body if field not in fields]

    item_info = f" in item '{item_name}'" if item_name else ""

    if missing_fields:
        raise APIException(
            f"Missing fields: {', '.join(missing_fields)}{item_info}", status_code=400)
    if extra_fields:
        raise APIException(
            f"Extra fields not allowed: {', '.join(extra_fields)}{item_info}", status_code=400)


def get_all_serialized(model, not_found_message):
    """
    Retrieve and serialize all objects of a given model.
    Args:
        model: The SQLAlchemy model class to query.
        not_found_message: The error message to return if no objects are found.
    Raises:
        APIException: If no objects are found.
    Returns:
        Response: A JSON list of serialized objects.
    """
    items = model.query.all()
    if items:
        return jsonify([item.serialize() for item in items]), 200
    else:
        raise APIException(not_found_message, status_code=404)


def normalize_body_to_list(body):
    """
    Normalize the request body to a list format.
    Args:
        body: The request body, which can be a dictionary or a list.
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


def get_country_by_name_or_404(country_name: str) -> Country:
    """
    Resolve a country by its name (globally unique) or raise a 404 error.
    Args:
        country_name: The name of the country to resolve.
    Raises:
        APIException: If the country name is missing or the country does not exist.
    Returns:
        Country: The resolved country object.
    """
    if not country_name or not isinstance(country_name, str):
        raise APIException('country_name is required', status_code=400)
    country = Country.query.filter_by(name=country_name).first()
    if not country:
        raise APIException('Country not found', status_code=404)
    return country


def get_city_by_names_or_404(country_name: str, city_name: str) -> City:
    """
    Resolve a city by its country name and city name or raise a 404 error.
    Args:
        country_name: The name of the country the city belongs to.
        city_name: The name of the city to resolve.
    Raises:
        APIException: If the country or city name is missing, or the city does not exist.
    Returns:
        City: The resolved city object.
    """
    if not country_name or not city_name:
        raise APIException(
            'country_name and city_name are required', status_code=400)
    city = City.query.join(Country, City.country_id == Country.id)\
        .filter(Country.name == country_name, City.name == city_name).first()
    if not city:
        raise APIException('City not found', status_code=404)
    return city


def ensure_unique_city_name_in_country(name: str, country_id: str, exclude_id: str | None = None):
    """
    Ensure that no other city with the same name exists in the specified country.
    Args:
        name: The name of the city to check.
        country_id: The ID of the country to check within.
        exclude_id: Optional. The ID of the city to exclude from the check.
    Raises:
        APIException: If a city with the same name already exists in the country.
    """
    q = City.query.filter_by(name=name, country_id=country_id)
    if exclude_id:
        q = q.filter(City.id != exclude_id)
    if q.first():
        raise APIException(
            f"City with name '{name}' already exists in this country", status_code=400)


def ensure_unique_poi_name_in_city(name: str, city_id: str, exclude_id: str | None = None):
    """
    Ensure that no other POI with the same name exists in the specified city.
    Args:
        name: The name of the POI to check.
        city_id: The ID of the city to check within.
        exclude_id: Optional. The ID of the POI to exclude from the check.
    Raises:
        APIException: If a POI with the same name already exists in the city.
    """
    q = Poi.query.filter_by(name=name, city_id=city_id)
    if exclude_id:
        q = q.filter(Poi.id != exclude_id)
    if q.first():
        raise APIException(
            f"POI with name '{name}' already exists in this city", status_code=400)


@api.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    Body:
        - name (str): The full name of the user.
        - user_name (str): The username of the user.
        - email (str): The email address of the user.
        - password (str): The password for the user account.
        - birth_date (str): The birth date of the user in mm/dd/yyyy format.
        - location (str, optional): The location of the user.
        - role (str, optional): The role of the user.
    Raises:
        APIException: If required fields are missing, the email/username already exists, or the birth_date format is invalid.
    Returns:
        Response: JSON with the created user or an error message.
    """
    body = request.get_json()
    body = require_json_object(body, context='register')

    required_fields = ['name', 'user_name', 'email', 'password', 'birth_date']
    missing_fields = [field for field in required_fields if field not in body]
    if missing_fields:
        raise APIException(
            f'Missing fields: {", ".join(missing_fields)}', status_code=400)

    name = body.get('name')
    user_name = body.get('user_name')
    email = body.get('email')
    password = generate_password_hash(body.get('password'))
    try:
        birth_date = datetime.strptime(body.get('birth_date'), "%m/%d/%Y")
    except Exception:
        raise APIException(
            'birth_date must be in mm/dd/yyyy format', status_code=400)
    location = body.get('location')
    role = body.get('role')

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
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.warning(
            f"Integrity error on register: {str(e.orig)}")
        raise APIException("Database integrity error", status_code=400)
    except Exception:
        db.session.rollback()
        handle_unexpected_error('registering user')

    return jsonify({'message': 'User registered successfully', 'user': user.serialize()}), 201


@api.route('/login', methods=['POST'])
def login():
    """
    Log in a user.
    Args:
        None (expects a JSON body with credentials).
    Body:
        - user_name: Optional. The username of the user (string).
        - email: Optional. The email address of the user (string).
        - password: The password for the user account (string).
    Raises:
        APIException: If credentials are missing or invalid.
    Returns:
        Response: JSON with an access token or an error message.
    """
    body = request.get_json()
    body = require_json_object(body, context='login')
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
        Response: JSON with the user's profile data.
    """
    user = get_authenticated_user()
    return jsonify(user.serialize()), 200


@api.route('/myProfile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update the authenticated user's profile.
    Args:
        None (expects a JSON body with fields to update).
    Body:
        - user_name: Optional. The new username for the user (string).
        - email: Optional. The new email address for the user (string).
        - location: Optional. The new location for the user (string).
        - password: Optional. The new password for the user account (string).
    Raises:
        APIException: If authentication fails or the data is invalid.
    Returns:
        Response: JSON with the updated user data or an error message.
    """
    user = get_authenticated_user()
    body = request.get_json()
    body = require_json_object(body, context='updating profile')
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
    except Exception:
        db.session.rollback()
        handle_unexpected_error('updating profile')


@api.route('/users', methods=['GET'])
def list_users():
    """
    List users.
    Returns:
        JSON list of users. Returns an empty list if none are found.
    """
    try:
        users = User.query.all()
        return jsonify([user.serialize() for user in users]), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('listing users')


@api.route('/users', methods=['POST'])
def add_user():
    """
    Add a new user.
    Args:
        None (expects a JSON body with user data).
    Body:
        - name: Full name of the user (string).
        - user_name: Username (string).
        - email: Email address (string).
        - password: Password (string).
        - birth_date: Birth date mm/dd/yyyy (string).
        - location: Optional. Location (string).
        - role: Optional. Role (string).
    Raises:
        APIException: If required fields are missing or email/username already exists.
    Returns:
        Response: JSON with the created user or error message.
    """
    body = request.get_json()
    body = require_json_object(body, context='creating user')
    required_fields = ['name', 'user_name', 'email', 'password', 'birth_date']
    missing_fields = [field for field in required_fields if field not in body]
    if missing_fields:
        raise APIException(
            f'Missing fields: {", ".join(missing_fields)}', status_code=400)

    name = body.get('name')
    user_name = body.get('user_name')
    email = body.get('email')
    password = generate_password_hash(body.get('password'))
    try:
        birth_date = datetime.strptime(body.get('birth_date'), "%m/%d/%Y")
    except Exception:
        raise APIException(
            'birth_date must be in mm/dd/yyyy format', status_code=400)
    location = body.get('location')  # Optional
    role = body.get('role')  # Optional

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
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.warning(
            f"Integrity error on user create: {str(e.orig)}")
        raise APIException("Database integrity error", status_code=400)
    except Exception:
        db.session.rollback()
        handle_unexpected_error('creating user')

    return jsonify({'message': 'User added successfully', 'user': user.serialize()}), 201


@api.route('/users/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """
    Delete a user by ID.
    Args:
        user_id (str): User ID.
    Raises:
        APIException: If the user does not exist.
    Returns:
        Response: JSON with success or error message.
    """
    user = get_object_or_404(User, user_id, 'User not found')
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception:
        db.session.rollback()
        handle_unexpected_error('deleting user')


@api.route('/favorites', methods=['GET'])
@jwt_required()
def favorites():
    """
    Retrieve the authenticated user's favorite POIs.
    Returns:
        JSON list with pairs [poi_id, poi_name]. Returns an empty list if none are found.
    Raises:
        APIException: If an unexpected error occurs.
    """
    user = get_authenticated_user()
    try:
        favorites = db.session.query(Favorite, Poi).join(
            Poi, Favorite.poi_id == Poi.id).filter(Favorite.user_id == user.id).all()
        return jsonify([[poi.id, poi.name] for _, poi in favorites]), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving favorites')


@api.route('/favorites', methods=['POST'])
@jwt_required()
def add_favorite():
    """
    Add a POI to the authenticated user's favorites.
    Args:
        None (expects a JSON body with poi_id).
    Raises:
        APIException: If authentication fails, required fields are missing, POI not found, or already in favorites.
    Returns:
        Response: JSON with added favorite or error message.
    """
    user = get_authenticated_user()
    body = request.get_json()
    body = require_json_object(body, context='adding favorite')
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
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.warning(
            f"Integrity error on add favorite: {str(e.orig)}")
        raise APIException("Database integrity error", status_code=400)
    except Exception:
        db.session.rollback()
        handle_unexpected_error('adding favorite')


@api.route('/favorites/<string:poi_id>', methods=['DELETE'])
@jwt_required()
def remove_favorite(poi_id):
    """
    Remove a POI from the authenticated user's favorites.
    Args:
        None (expects a JSON body with poi_id).
    Raises:
        APIException: If authentication fails, required fields are missing, or favorite not found.
    Returns:
        Response: JSON with success or error message.
    """
    user = get_authenticated_user()
    favorite = get_object_or_404(
        Favorite, (user.id, poi_id), 'Favorite not found')
    try:
        db.session.delete(favorite)
        db.session.commit()
        return jsonify({'message': 'Favorite removed successfully'}), 200
    except Exception:
        db.session.rollback()
        handle_unexpected_error('removing favorite')


@api.route('/pois', methods=['GET'])
def get_pois():
    """
    Retrieve POIs with optional filters via query string.
    Supported filters:
      - name: partial match (ilike) on POI name.
      - tag_id: exact match.
      - tag_name: exact match.
      - country_name: exact match.
      - city_name: exact match.
    Returns:
      JSON list of POIs. Returns an empty list if none are found.
    """
    try:
        q = Poi.query

        name = request.args.get('name')
        if name:
            q = q.filter(Poi.name.ilike(f'%{name}%'))

        country_name = request.args.get('country_name')
        city_name = request.args.get('city_name')
        if country_name or city_name:
            q = q.join(City, Poi.city_id == City.id).join(
                Country, City.country_id == Country.id)
            if country_name:
                q = q.filter(Country.name == country_name)
            if city_name:
                q = q.filter(City.name == city_name)

        tag_id = request.args.get('tag_id')
        tag_name = request.args.get('tag_name')
        if tag_id or tag_name:
            q = q.join(PoiTag, PoiTag.poi_id == Poi.id)
            if tag_name:
                q = q.join(Tag, Tag.id == PoiTag.tag_id).filter(
                    Tag.name == tag_name)
            if tag_id:
                q = q.filter(PoiTag.tag_id == tag_id)

        pois = q.all()
        return jsonify([poi.serialize() for poi in pois]), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving POIs')


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
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving POI')


@api.route('/countries', methods=['GET'])
def get_countries():
    """
    Retrieve countries with optional filters via query string.
    Supported filters:
      - name: partial match (ilike) on country name.
    Returns:
      JSON list of countries. Returns an empty list if none are found.
    """
    try:
        q = Country.query
        name = request.args.get('name')
        if name:
            q = q.filter(Country.name.ilike(f'%{name}%'))
        countries = q.all()
        return jsonify([country.serialize() for country in countries]), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving countries')


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
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving country')


@api.route('/cities', methods=['GET'])
def get_cities():
    """
    Retrieve cities with optional filters via query string.
    Supported filters:
      - season: exact match.
      - country_name: exact match.
      - name: partial match (ilike) on city name.
    Returns:
      JSON list of cities. Returns an empty list if none are found.
    """
    try:
        q = City.query

        season = request.args.get('season')
        if season:
            q = q.filter(City.season == season)

        country_name = request.args.get('country_name')
        if country_name:
            q = q.join(Country, City.country_id == Country.id).filter(
                Country.name == country_name)

        name = request.args.get('name')
        if name:
            q = q.filter(City.name.ilike(f'%{name}%'))

        cities = q.all()
        return jsonify([city.serialize() for city in cities]), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving cities')


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
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving city')


@api.route('/popular-pois', methods=['GET'])
def get_popular_pois():
    """
    Retrieve a random list of up to 20 POIs.
    Returns:
        JSON list of POIs. Returns an empty list if none are found.
    """
    try:
        pois = Poi.query.order_by(db.func.random()).limit(20).all()
        return jsonify([poi.serialize() for poi in pois]), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving popular POIs')


@api.route('/visited', methods=['GET'])
@jwt_required()
def get_visited_pois():
    """
    Retrieve the authenticated user's visited POIs.
    Returns:
        JSON list of visited POIs. Returns an empty list if none are found.
    """
    user = get_authenticated_user()
    try:
        visited = db.session.query(Visited, Poi).join(
            Poi, Visited.poi_id == Poi.id).filter(Visited.user_id == user.id).all()
        return jsonify([poi.serialize() for _, poi in visited]), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving visited POIs')


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
    body = require_json_object(body, context='adding visited POI')
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
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.warning(
            f"Integrity error on add visited: {str(e.orig)}")
        raise APIException("Database integrity error", status_code=400)
    except Exception:
        db.session.rollback()
        handle_unexpected_error('adding visited POI')


@api.route('/visited/<string:poi_id>', methods=['DELETE'])
@jwt_required()
def delete_visited_poi(poi_id):
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
    visited = get_object_or_404(
        Visited, (user.id, poi_id), 'Visited POI not found')
    try:
        db.session.delete(visited)
        db.session.commit()
        return jsonify({'message': 'POI removed from visited list'}), 200
    except Exception:
        db.session.rollback()
        handle_unexpected_error('removing visited POI')


@api.route('/tags', methods=['POST'])
def create_tag():
    """
    Create one or more tags.
    Body:
      - Required: name
    Errors:
      - 400 if a tag with the same name already exists.
    """
    body = request.get_json()
    items = normalize_body_to_list(body)
    created = []
    for item in items:
        name = item.get('name')
        require_body_fields(item, ['name'], item_name=name)
        existing_tag = Tag.query.filter_by(name=name).first()
        if existing_tag:
            raise APIException(f"Tag '{name}' already exists", status_code=400)
        id = str(uuid.uuid4())
        tag = Tag(id=id, name=name)
        created.append(tag)
    try:
        db.session.add_all(created)
        db.session.commit()
        return jsonify({'message': 'Tags created successfully', 'created': [tag.serialize() for tag in created]}), 201
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.warning(
            f"Integrity error on create tag: {str(e.orig)}")
        raise APIException("Database integrity error", status_code=400)
    except Exception:
        handle_unexpected_error('creating tags')


@api.route('/tags', methods=['GET'])
def list_tags():
    """
    List all tags.
    Returns:
        JSON list of tags. Returns an empty list if none are found.
    """
    try:
        tags = Tag.query.all()
        return jsonify([tag.serialize() for tag in tags]), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('listing tags')


@api.route('/tags/<string:tag_id>', methods=['GET'])
def get_tag(tag_id):
    """
    Retrieve a tag by its ID.
    Args:
        tag_id (str): Tag ID.
    Raises:
        APIException: If tag not found.
    Returns:
        Response: JSON with tag details.
    """
    try:
        tag = get_object_or_404(Tag, tag_id, 'Tag not found')
        return jsonify(tag.serialize()), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving tag')


@api.route('/tags/<string:tag_id>', methods=['DELETE'])
def delete_tag(tag_id):
    """
    Delete a tag by its ID.
    Args:
        tag_id (str): Tag ID.
    Raises:
        APIException: If tag not found.
    Returns:
        Response: JSON with success or error message.
    """
    tag = get_object_or_404(Tag, tag_id, 'Tag not found')
    try:
        db.session.delete(tag)
        db.session.commit()
        return jsonify({'message': 'Tag deleted successfully'}), 200
    except Exception:
        db.session.rollback()
        handle_unexpected_error('deleting tag')


@api.route('/pois/<string:poi_id>/tags/<string:tag_id>', methods=['POST'])
def add_tag_to_poi(poi_id, tag_id):
    """
    Associate a tag to a POI.
    Args:
        poi_id (str): POI ID.
        tag_id (str): Tag ID.
    Raises:
        APIException: If POI or Tag not found, or already associated.
    Returns:
        Response: JSON with updated POI.
    """
    try:
        poi = get_object_or_404(Poi, poi_id, 'POI not found')
        tag = get_object_or_404(Tag, tag_id, 'Tag not found')

        existing = PoiTag.query.filter_by(poi_id=poi.id, tag_id=tag.id).first()
        if existing:
            raise APIException(
                'Tag already associated with this POI', status_code=400)
        # Create association
        poi_tag = PoiTag(poi_id=poi.id, tag_id=tag.id)
        db.session.add(poi_tag)
        db.session.commit()
        return jsonify({'message': 'Tag added to POI'}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('adding tag to POI')


@api.route('/pois/<string:poi_id>/tags/<string:tag_id>', methods=['DELETE'])
def remove_tag_from_poi(poi_id, tag_id):
    """
    Remove a tag from a POI.
    Args:
        poi_id (str): POI ID.
        tag_id (str): Tag ID.
    Raises:
        APIException: If POI or Tag not found, or not associated.
    Returns:
        Response: JSON with updated POI.
    """
    try:
        poi = get_object_or_404(Poi, poi_id, 'POI not found')
        tag = get_object_or_404(Tag, tag_id, 'Tag not found')
        poi_tag = get_object_or_404(
            PoiTag, (poi.id, tag.id), 'Tag not associated with this POI')
        db.session.delete(poi_tag)
        db.session.commit()
        return jsonify({'message': 'Tag removed from POI'}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('removing tag from POI')


@api.route('/poiimages', methods=['POST'])
def create_poi_image():
    """
    Create one or more POI images.
    Body:
      - Required: url, poi_id
    Errors:
      - 404 if the POI does not exist.
    """
    body = request.get_json()
    items = normalize_body_to_list(body)

    created = []
    for item in items:
        url = item.get('url')
        poi_id = item.get('poi_id')
        require_body_fields(item, ['url', 'poi_id'], item_name=url)
        poi = get_object_or_404(Poi, poi_id, 'POI not found')
        id = str(uuid.uuid4())
        poi_image = PoiImage(id=id, url=url, poi_id=poi_id)
        created.append(poi_image)
    try:
        db.session.add_all(created)
        db.session.commit()
        return jsonify({'message': 'POI images created successfully', 'created': [img.serialize() for img in created]}), 201
    except Exception:
        db.session.rollback()
        handle_unexpected_error('creating POI images')


@api.route('/poiimages/<string:image_id>', methods=['GET'])
def get_poi_image(image_id):
    """
    Retrieve a POI image by its ID.
    Args:
        image_id (str): POI image ID.
    Raises:
        APIException: If POI image not found.
    Returns:
        Response: JSON with POI image details.
    """
    try:
        poi_image = get_object_or_404(
            PoiImage, image_id, 'POI image not found')
        return jsonify(poi_image.serialize()), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving POI image')


@api.route('/poiimages/<string:image_id>', methods=['DELETE'])
def delete_poi_image(image_id):
    """
    Delete a POI image by its ID.
    Args:
        image_id (str): POI image ID.
    Raises:
        APIException: If POI image not found.
    Returns:
        Response: JSON with success or error message.
    """
    poi_image = PoiImage.query.get(image_id)
    if not poi_image:
        raise APIException('POI image not found', status_code=404)
    try:
        db.session.delete(poi_image)
        db.session.commit()
        return jsonify({'message': 'POI image deleted successfully'}), 200
    except Exception:
        db.session.rollback()
        handle_unexpected_error('deleting POI image')


@api.route('/pois/<string:poi_id>/tags', methods=['GET'])
def get_tags_of_poi(poi_id):
    """
    Retrieve all tags associated with a given POI.
    Args:
        poi_id (str): POI ID.
    Returns:
        JSON list of tags. Returns an empty list if none are associated.
    Raises:
        APIException: If the POI does not exist or an unexpected error occurs.
    """
    try:
        poi = get_object_or_404(Poi, poi_id, 'POI not found')
        tags = db.session.query(Tag).join(PoiTag, PoiTag.tag_id == Tag.id)\
            .filter(PoiTag.poi_id == poi.id).all()
        return jsonify([t.serialize() for t in tags]), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving tags of POI')
