from flask import Flask, request, jsonify, url_for, Blueprint, current_app
import uuid
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from flask_cors import CORS
from api.utils import generate_sitemap, APIException
from api.models import db, User, Poi, Country, City, Favorite, Visited, PoiImage, Tag, PoiTag




api = Blueprint('api', __name__)
CORS(api)

PROFILE_ALLOWED_FIELDS = {'user_name', 'email', 'location', 'password'}
COUNTRY_ALLOWED_FIELDS = {'name', 'img'}
CITY_ALLOWED_FIELDS = {'name', 'img', 'season', 'country_id'}
POI_ALLOWED_FIELDS = {'name', 'description',
                      'latitude', 'longitude', 'city_id'}


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


def get_object_or_404(model, unique_field_value, not_found_message, field_name="id"):
    """
    Retrieve an object by a unique field from the database.
    Args:
        model: The SQLAlchemy model class to query.
        unique_field_value: The value of the unique field to retrieve.
        not_found_message: The error message to return if the object is not found.
        field_name: The name of the unique field (default is 'id').
    Raises:
        APIException: If the object does not exist.
    Returns:
        db.Model: The retrieved object.
    """
    obj = model.query.filter(getattr(model, field_name)
                             == unique_field_value).first()
    if not obj:
        raise APIException(not_found_message, status_code=404)
    return obj


def require_body_fields(body, fields, item_name=None, optional_fields=None):
    """
    Ensure that the request body contains exactly the required fields and that they are not empty.
    Args:
        body: The request body (dict).
        fields: A list of required field names.
        item_name: Optional. The name of the item being validated.
        optional_fields: Optional. A list of field names that are allowed but not required.
    Raises:
        APIException: If any required field is missing, empty, or if there are extra fields.
    """
    missing_fields = [field for field in fields if field not in body]
    extra_fields = [field for field in body if field not in fields and field not in (
        optional_fields or [])]
    empty_fields = [field for field in fields if not body.get(field)]

    item_info = f" in item '{item_name}'" if item_name else ""

    if missing_fields:
        raise APIException(
            f"Missing fields: {', '.join(missing_fields)}{item_info}", status_code=400)
    if extra_fields:
        raise APIException(
            f"Extra fields not allowed: {', '.join(extra_fields)}{item_info}", status_code=400)
    if empty_fields:
        raise APIException(
            f"Fields cannot be empty: {', '.join(empty_fields)}{item_info}", status_code=400)


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

    if not isinstance(body, list):
        raise APIException('Invalid input format', status_code=400)

    if not body:
        raise APIException('Input list cannot be empty', status_code=400)

    for item in body:
        if not isinstance(item, dict):
            raise APIException(
                'Each item must be a JSON object', status_code=400)

    return body


@api.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    Args:
        None.
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
        Response: JSON with the created user and a success message.
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
        None.
    Body:
        - user_name (str, optional): Username of the user.
        - email (str, optional): Email address of the user.
        - password (str): Password for the user account.
    Raises:
        APIException: If credentials are missing or invalid.
    Returns:
        Response: JSON with an access token and a success message.
    """
    body = request.get_json()
    body = require_json_object(body, context='login')
    credential = body.get('credential')
    password = body.get('password')

    if not credential or not password:
        raise APIException(
            'Email or user_name and password are required', status_code=400)
    user = User.query.filter_by(email=credential).first(
    ) or User.query.filter_by(user_name=credential).first()
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
    Body:
        None.
    Raises:
        APIException: If authentication fails.
    Returns:
        Response: JSON with the user's profile data and a success message.
    """
    user = get_authenticated_user()
    return jsonify({'message': 'Profile retrieved successfully', 'user': user.serialize()}), 200


@api.route('/myProfile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update the authenticated user's profile.
    Args:
        None.
    Body:
        - user_name (str, optional): New username for the user.
        - email (str, optional): New email address.
        - location (str, optional): New location for the user.
        - password (str, optional): New password for the account.
    Raises:
        APIException: If authentication fails or the data is invalid.
    Returns:
        Response: JSON with the updated user data and a success message.
    """
    user = get_authenticated_user()
    body = request.get_json()
    body = require_json_object(body, context='updating profile')
    allowed_fields = PROFILE_ALLOWED_FIELDS
    provided_keys = set(body.keys())
    if not provided_keys or not provided_keys.issubset(allowed_fields):
        raise APIException('No valid fields supplied', status_code=400)
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
    Args:
        None.
    Body:
        None.
    Raises:
        APIException: If an unexpected error occurs.
    Returns:
        Response: JSON list of users and a success message. Returns an empty list if none are found.
    """
    try:
        users = User.query.all()
        return jsonify({'message': 'Users retrieved successfully', 'users': [user.serialize() for user in users]}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('listing users')


@api.route('/users', methods=['POST'])
def add_user():
    """
    Add a new user.
    Args:
        None.
    Body:
        - name (str): Full name of the user.
        - user_name (str): Username.
        - email (str): Email address.
        - password (str): Password.
        - birth_date (str): Birth date mm/dd/yyyy.
        - location (str, optional): Location.
        - role (str, optional): Role.
    Raises:
        APIException: If required fields are missing or email/username already exists.
    Returns:
        Response: JSON with the created user and a success message.
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


@api.route('/users/<string:username>', methods=['DELETE'])
def delete_user(username):
    """
    Delete a user by username.
    Args:
        username (str): Username of the user to delete.
    Raises:
        APIException: If the user does not exist.
    Returns:
        Response: JSON with success or error message.
    """
    user = get_object_or_404(
        User,
        unique_field_value=username,
        not_found_message='User not found',
        field_name="user_name"
    )
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
    Args:
        None.
    Body:
        None.
    Raises:
        APIException: If an unexpected error occurs.
    Returns:
        Response: JSON list of pairs [poi_id, poi_name]. Returns an empty list if none are found.
    """
    user = get_authenticated_user()
    try:
        favorites = db.session.query(Favorite, Poi).join(
            Poi, Favorite.poi_id == Poi.id).filter(Favorite.user_id == user.id).all()
        favorites_list = [
            {
                'poi_id': poi.id,
                'poi_name': poi.name
            }
            for _, poi in favorites
        ]
        return jsonify({
            'message': 'Favorites retrieved successfully',
            'favorites': favorites_list
        }), 200
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
    poi = get_object_or_404(
        Poi,
        unique_field_value=poi_id,
        not_found_message='Point of interest not found'
    )

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
        poi_id (str): POI ID.
    Body:
        None.
    Raises:
        APIException: If authentication fails or the favorite is not found.
    Returns:
        Response: JSON with success or error message.
    """
    user = get_authenticated_user()
    favorite = Favorite.query.filter_by(user_id=user.id, poi_id=poi_id).first()
    if not favorite:
        raise APIException('Favorite not found', status_code=404)
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
    Args:
        None.
    Query Parameters:
        - name (str, optional): Partial match on POI name.
        - tag_name (str, optional): Exact match on tag name.
        - country_name (str, optional): Exact match on country name.
        - city_name (str, optional): Exact match on city name.
    Raises:
        APIException: If an unexpected error occurs.
    Returns:
        Response: JSON list of POIs. Returns an empty list if none are found.
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

        tag_name = request.args.get('tag_name')
        if tag_name:
            q = q.join(PoiTag, PoiTag.poi_id == Poi.id)
            q = q.join(Tag, Tag.id == PoiTag.tag_id).filter(
                Tag.name == tag_name)

        pois = q.all()
        return jsonify({'message': 'POIs retrieved successfully', 'pois': [poi.serialize() for poi in pois]}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving POIs')


@api.route('/pois/<string:poi_id>', methods=['GET'])
def get_poi(poi_id):
    """
    Retrieve details of a POI by its ID.
    Args:
        poi_id (str): POI ID.
    Body:
        None.
    Raises:
        APIException: If POI is not found.
    Returns:
        Response: JSON with POI details.
    """
    try:
        poi = get_object_or_404(
            Poi,
            unique_field_value=poi_id,
            not_found_message='Point of interest not found'
        )
        return jsonify({'message': 'POI retrieved successfully', 'poi': poi.serialize()}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving POI')


@api.route('/countries', methods=['GET'])
def get_countries():
    """
    Retrieve countries with optional filters via query string.
    Args:
        None.
    Query Parameters:
        - name (str, optional): Partial match on country name.
    Raises:
        APIException: If an unexpected error occurs.
    Returns:
        Response: JSON list of countries. Returns an empty list if none are found.
    """
    try:
        q = Country.query

        name = request.args.get('name')
        if name:
            q = q.filter(Country.name.ilike(f'%{name}%'))
        countries = q.all()
        return jsonify({'message': 'Countries retrieved successfully', 'countries': [country.serialize() for country in countries]}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving countries')


@api.route('/countries/<string:country_id>', methods=['GET'])
def get_country_by_id(country_id):
    """
    Retrieve details of a country by its ID.
    Args:
        country_id (str): Country ID.
    Body:
        None.
    Raises:
        APIException: If the country is not found.
    Returns:
        Response: JSON with country details.
    """
    try:
        country = get_object_or_404(
            Country,
            unique_field_value=country_id,
            not_found_message='Country not found',
            field_name='id'
        )
        return jsonify({'message': 'Country retrieved successfully', 'country': country.serialize()}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving country by id')
        

@api.route('/countries/<string:country_name>', methods=['GET'])
def get_country(country_name):
    """
    Retrieve details of a country by its name.
    Args:
        country_name (str): Country name.
    Body:
        None.
    Raises:
        APIException: If the country is not found.
    Returns:
        Response: JSON with country details.
    """
    try:
        country = get_object_or_404(
            Country,
            unique_field_value=country_name,
            not_found_message='Country not found',
            field_name='name'
        )
        return jsonify({'message': 'Country retrieved successfully', 'country': country.serialize()}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving country')


@api.route('/cities', methods=['GET'])
def get_cities():
    """
    Retrieve cities with optional filters via query string.
    Args:
        None.
    Query Parameters:
        - season (str, optional): Exact match on preferred season.
        - country_name (str, optional): Exact match on country name.
        - name (str, optional): Partial match on city name.
    Raises:
        APIException: If an unexpected error occurs.
    Returns:
        Response: JSON list of cities. Returns an empty list if none are found.
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
        return jsonify({'message': 'Cities retrieved successfully', 'cities': [city.serialize() for city in cities]}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving cities')


@api.route('/cities/<string:city_id>', methods=['GET'])
def get_city(city_id):
    """
    Retrieve details of a city by its ID.
    Args:
        city_id (str): City ID.
    Body:
        None.
    Raises:
        APIException: If the city is not found.
    Returns:
        Response: JSON with city details.
    """
    try:
        city = get_object_or_404(
            City,
            unique_field_value=city_id,
            not_found_message='City not found'
        )
        return jsonify({'message': 'City retrieved successfully', 'city': city.serialize()}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving city')


@api.route('/popular-pois', methods=['GET'])
def get_popular_pois():
    """
    Retrieve a random list of up to 8 POIs.
    Args:
        None.
    Body:
        None.
    Raises:
        APIException: If an unexpected error occurs.
    Returns:
        Response: JSON list of POIs. Returns an empty list if none are found.
    """
    try:
        pois = Poi.query.order_by(db.func.random()).limit(8).all()
        return jsonify({'message': 'Popular POIs retrieved successfully', 'pois': [poi.serialize() for poi in pois]}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving popular POIs')


@api.route('/visited', methods=['GET'])
@jwt_required()
def get_visited_pois():
    """
    Retrieve the authenticated user's visited POIs.
    Args:
        None.
    Body:
        None.
    Raises:
        APIException: If an unexpected error occurs.
    Returns:
        Response: JSON list of visited POIs. Returns an empty list if none are found.
    """
    user = get_authenticated_user()
    try:
        visited = db.session.query(Visited, Poi).join(
            Poi, Visited.poi_id == Poi.id).filter(Visited.user_id == user.id).all()
        visited_list = [
            {
                'poi_id': poi.id,
                'poi_name': poi.name
            }
            for _, poi in visited
        ]
        return jsonify({
            'message': 'Visited POIs retrieved successfully',
            'visited': visited_list
        }), 200
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
    poi = get_object_or_404(
        Poi,
        unique_field_value=poi_id,
        not_found_message='POI not found'
    )

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
        poi_id (str): POI ID.
    Raises:
        APIException: If authentication fails or the visited POI is not found.
    Returns:
        Response: JSON with success or error message.
    """
    user = get_authenticated_user()
    visited = Visited.query.filter_by(user_id=user.id, poi_id=poi_id).first()
    if not visited:
        raise APIException('Visited POI not found', status_code=404)
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
    Args:
        None.
    Body:
        - name (str): Tag name (unique).
    Raises:
        APIException: If a tag with the same name already exists or a database error occurs.
    Returns:
        Response: JSON with the created tags and a success message.
    """
    body = request.get_json()
    items = normalize_body_to_list(body)
    created = []
    seen_keys = set()
    for item in items:
        name = item.get('name')
        require_body_fields(item, ['name'], item_name=name)
        key = name
        if key in seen_keys:
            raise APIException(f"Duplicate entry: {key}", status_code=400)
        seen_keys.add(key)
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
        db.session.rollback()
        handle_unexpected_error('creating tags')


@api.route('/tags', methods=['GET'])
def list_tags():
    """
    List all tags.
    Args:
        None.
    Body:
        None.
    Raises:
        APIException: If an unexpected error occurs.
    Returns:
        Response: JSON list of tags. Returns an empty list if none are found.
    """
    try:
        tags = Tag.query.all()
        return jsonify({'message': 'Tags retrieved successfully', 'tags': [tag.serialize() for tag in tags]}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('listing tags')


@api.route('/tags/<string:tag_name>', methods=['GET'])
def get_tag(tag_name):
    """
    Retrieve a tag by its name.
    Args:
        tag_name (str): Tag name.
    Body:
        None.
    Raises:
        APIException: If the tag is not found.
    Returns:
        Response: JSON with tag details.
    """
    try:
        tag = get_object_or_404(
            Tag,
            unique_field_value=tag_name,
            not_found_message='Tag not found',
            field_name='name'
        )
        return jsonify({'message': 'Tag retrieved successfully', 'tag': tag.serialize()}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving tag')


@api.route('/tags/<string:tag_name>', methods=['DELETE'])
def delete_tag(tag_name):
    """
    Delete a tag by its name.
    Args:
        tag_name (str): Tag name.
    Body:
        None.
    Raises:
        APIException: If the tag is not found.
    Returns:
        Response: JSON with success or error message.
    """
    tag = get_object_or_404(
        Tag,
        unique_field_value=tag_name,
        not_found_message='Tag not found',
        field_name='name'
    )
    try:
        db.session.delete(tag)
        db.session.commit()
        return jsonify({'message': 'Tag deleted successfully'}), 200
    except Exception:
        db.session.rollback()
        handle_unexpected_error('deleting tag')


@api.route('/pois/<string:poi_id>/tags/<string:tag_name>', methods=['POST'])
def add_tag_to_poi(poi_id, tag_name):
    """
    Associate a tag to a POI by tag name.
    Args:
        poi_id (str): POI ID.
        tag_name (str): Tag name.
    Body:
        None.
    Raises:
        APIException: If POI or tag is not found, or if already associated.
    Returns:
        Response: JSON with success message.
    """
    try:
        poi = get_object_or_404(
            Poi,
            unique_field_value=poi_id,
            not_found_message='POI not found'
        )
        tag = get_object_or_404(
            Tag,
            unique_field_value=tag_name,
            not_found_message='Tag not found',
            field_name='name'
        )

        existing = PoiTag.query.filter_by(poi_id=poi.id, tag_id=tag.id).first()
        if existing:
            raise APIException(
                'Tag already associated with this POI', status_code=400)
        poi_tag = PoiTag(poi_id=poi.id, tag_id=tag.id)
        db.session.add(poi_tag)
        db.session.commit()
        return jsonify({'message': 'Tag added to POI'}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('adding tag to POI')


@api.route('/pois/<string:poi_id>/tags/<string:tag_name>', methods=['DELETE'])
def remove_tag_from_poi(poi_id, tag_name):
    """
    Remove a tag from a POI by tag name.
    Args:
        poi_id (str): POI ID.
        tag_name (str): Tag name.
    Body:
        None.
    Raises:
        APIException: If POI or tag is not found, or if they are not associated.
    Returns:
        Response: JSON with success message.
    """
    try:
        poi = get_object_or_404(
            Poi,
            unique_field_value=poi_id,
            not_found_message='POI not found'
        )
        tag = get_object_or_404(
            Tag,
            unique_field_value=tag_name,
            not_found_message='Tag not found',
            field_name='name'
        )
        poi_tag = get_object_or_404(
            PoiTag,
            unique_field_value=(poi.id, tag.id),
            not_found_message='Tag not associated with this POI'
        )
        db.session.delete(poi_tag)
        db.session.commit()
        return jsonify({'message': 'Tag removed from POI'}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('removing tag from POI')


@api.route('/pois/<string:poi_id>/tags', methods=['GET'])
def get_tags_of_poi(poi_id):
    """
    Retrieve all tags associated with a given POI.
    Args:
        poi_id (str): POI ID.
    Body:
        None.
    Raises:
        APIException: If the POI does not exist or an unexpected error occurs.
    Returns:
        Response: JSON list of tags. Returns an empty list if none are associated.
    """
    try:
        poi = get_object_or_404(
            Poi,
            unique_field_value=poi_id,
            not_found_message='POI not found'
        )
        tags = db.session.query(Tag).join(PoiTag, PoiTag.tag_id == Tag.id)\
            .filter(PoiTag.poi_id == poi.id).all()
        return jsonify({'message': 'Tags retrieved successfully', 'tags': [t.serialize() for t in tags]}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving tags of POI')


@api.route('/pois/<string:poi_id>/poiimages', methods=['GET'])
def get_images_of_poi(poi_id):
    """
    Retrieve all images associated with a given POI.
    Args:
        poi_id (str): POI ID.
    Body:
        None.
    Raises:
        APIException: If the POI does not exist or an unexpected error occurs.
    Returns:
        Response: JSON list of POI images. Returns an empty list if none are associated.
    """
    try:
        poi = get_object_or_404(
            Poi,
            unique_field_value=poi_id,
            not_found_message='POI not found'
        )
        images = PoiImage.query.filter_by(poi_id=poi.id).all()
        return jsonify({'message': 'POI images retrieved successfully', 'images': [img.serialize() for img in images]}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving images of POI')


@api.route('/poiimages', methods=['POST'])
def create_poi_image():
    """
    Create one or more POI images.
    Args:
        None.
    Body:
        - url (str): Image URL.
        - poi_id (str): Associated POI ID.
    Raises:
        APIException: If the POI does not exist or a database error occurs.
    Returns:
        Response: JSON with the created POI images and a success message.
    """
    body = request.get_json()
    items = normalize_body_to_list(body)

    created = []
    seen_pairs = set()
    for item in items:
        url = item.get('url')
        poi_id = item.get('poi_id')
        require_body_fields(item, ['url', 'poi_id'], item_name=url)
        key = (url, poi_id)
        if key in seen_pairs:
            raise APIException(f"Duplicate entry: {url}", status_code=400)
        seen_pairs.add(key)
        poi = get_object_or_404(
            Poi,
            unique_field_value=poi_id,
            not_found_message='POI not found'
        )
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
    Body:
        None.
    Raises:
        APIException: If the POI image is not found.
    Returns:
        Response: JSON with POI image details.
    """
    try:
        poi_image = get_object_or_404(
            PoiImage,
            unique_field_value=image_id,
            not_found_message='POI image not found'
        )
        return jsonify({'message': 'POI image retrieved successfully', 'image': poi_image.serialize()}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving POI image')


@api.route('/pois', methods=['POST'])
def create_poi():
    """
    Create one or more points of interest (POIs).
    Args:
        None.
    Body:
        - name (str): POI name.
        - description (str): POI description.
        - latitude (str): Latitude.
        - longitude (str): Longitude.
        - country_name (str): Country name.
        - city_name (str): City name.
        - tags (list): Optional. List of tags associated with the POI.
        - poiimages (list): Optional. List of POI images.  
    Raises:
        APIException: If the city does not exist, a duplicate name exists in the same city, or a database error occurs.
    Returns:
        Response: JSON with the created POIs and a success message.
    """
    body = request.get_json()
    items = normalize_body_to_list(body)

    created = []
    poi_tag_relations = []
    poi_images_relations = []
    seen_keys = set()
    for item in items:
        name = item.get('name')
        require_body_fields(
            item, ['name', 'description', 'latitude', 'longitude', 'country_name', 'city_name'], item_name=name, optional_fields=['tags', 'poiimages'])
        try:
            latitude = float(item.get('latitude'))
            longitude = float(item.get('longitude'))
        except (TypeError, ValueError):
            raise APIException('latitude/longitude must be numeric', 400)
        country = Country.query.filter_by(
            name=item.get('country_name')).first()
        if not country:
            raise APIException(
                f"Country '{item.get('country_name')}' not found", status_code=400)
        city = City.query.filter_by(name=item.get(
            'city_name'), country_id=country.id).first()
        if not city:
            raise APIException(
                f"City '{item.get('city_name')}' in country '{item.get('country_name')}' not found", status_code=400)
        key = f"{name}:{city.id}"
        if key in seen_keys:
            raise APIException(f"Duplicate entry: {key}", status_code=400)
        seen_keys.add(key)
        existing = Poi.query.filter_by(name=name, city_id=city.id).first()
        if existing:
            raise APIException(
                f"POI '{name}' already exists in this city", status_code=400)
        tags = item.get('tags', [])
        if not isinstance(tags, list):
            raise APIException('tags must be a list', 400)
        for tag in tags:
            if not isinstance(tag, str) or not tag:
                raise APIException('each tag must be a non-empty string', 400)
        poiimages = item.get('poiimages', [])
        if not isinstance(poiimages, list):
            raise APIException('poiimages must be a list', 400)
        for img in poiimages:
            if not isinstance(img, str) or not img:
                raise APIException(
                    'each poiimage must be a non-empty string', 400)
        poi = Poi(
            id=str(uuid.uuid4()),
            name=name,
            description=item.get('description'),
            latitude=latitude,
            longitude=longitude,
            city_id=city.id
        )
        created.append(poi)
        for tag_name in tags:
            tag = Tag.query.filter_by(name=tag_name).first()
            if not tag:
                raise APIException(
                    f"Tag '{tag_name}' not found", status_code=404)
            poi_tag_relations.append(PoiTag(poi_id=poi.id, tag_id=tag.id))
        for img in poiimages:
            poi_images_relations.append(
                PoiImage(id=str(uuid.uuid4()), url=img, poi_id=poi.id))
    try:
        db.session.add_all(created)
        db.session.flush()  # Flush to assign IDs before creating PoiTag entries
        db.session.add_all(poi_tag_relations)
        db.session.add_all(poi_images_relations)

        db.session.commit()
        return jsonify({'message': 'POIs created successfully',
                        'created': [poi.serialize() for poi in created]}), 201
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.warning(
            f"Integrity error on create POI: {str(e.orig)}")
        raise APIException("Database integrity error", status_code=400)
    except Exception:
        db.session.rollback()
        handle_unexpected_error('creating POIs')


@api.route('/pois/<string:poi_id>', methods=['PUT'])
def update_poi(poi_id):
    """
    Update an existing point of interest (POI).
    Args:
        poi_id (str): POI ID.
    Body:
        - name (str, optional): POI name.
        - description (str, optional): POI description.
        - latitude (str, optional): Latitude.
        - longitude (str, optional): Longitude.
        - city_id (str, optional): City ID.
    Raises:
        APIException: If the POI or provided city does not exist, or a database error occurs.
    Returns:
        Response: JSON with the updated POI.
    """
    poi = get_object_or_404(Poi, unique_field_value=poi_id,
                            not_found_message='POI not found')
    body = request.get_json()
    body = require_json_object(body, context='updating POI')
    allowed_fields = POI_ALLOWED_FIELDS
    provided_keys = set(body.keys())
    if not provided_keys or not provided_keys.issubset(allowed_fields):
        raise APIException('No valid fields supplied', status_code=400)

    # Determine prospective new values
    current_name = poi.name
    current_city_id = poi.city_id
    new_city_id = current_city_id
    if 'city_id' in body and body.get('city_id'):
        city = get_object_or_404(
            City,
            unique_field_value=body.get('city_id'),
            not_found_message='City not found')
        new_city_id = city.id
    new_name = body.get('name', current_name)

    # Check for existing POI with same name and city
    if new_name != current_name or new_city_id != current_city_id:
        existing_poi = Poi.query.filter_by(
            name=new_name, city_id=new_city_id).first()
        if existing_poi and existing_poi.id != poi.id:
            raise APIException('POI already exists in this city', 400)

    # Apply updates
    if 'city_id' in body and body.get('city_id'):
        poi.city_id = new_city_id
    if 'name' in body and body.get('name'):
        poi.name = new_name
    if 'description' in body and body.get('description'):
        poi.description = body.get('description')
    if 'latitude' in body and body.get('latitude'):
        try:
            poi.latitude = float(body.get('latitude'))
        except (TypeError, ValueError):
            raise APIException('latitude/longitude must be numeric', 400)
    if 'longitude' in body and body.get('longitude'):
        try:
            poi.longitude = float(body.get('longitude'))
        except (TypeError, ValueError):
            raise APIException('latitude/longitude must be numeric', 400)
    try:
        db.session.commit()
        return jsonify({'message': 'POI updated successfully', 'poi': poi.serialize()}), 200
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.warning(
            f"Integrity error on update POI: {str(e.orig)}")
        raise APIException("Database integrity error", status_code=400)
    except Exception:
        db.session.rollback()
        handle_unexpected_error('updating POI')


@api.route('/pois/<string:poi_id>', methods=['DELETE'])
def delete_poi(poi_id):
    """
    Delete a point of interest (POI) by its ID.
    Args:
        poi_id (str): POI ID.
    Body:
        None.
    Raises:
        APIException: If the POI does not exist or a database error occurs.
    Returns:
        Response: JSON with success message.
    """
    poi = get_object_or_404(Poi, unique_field_value=poi_id,
                            not_found_message='POI not found')
    try:
        db.session.delete(poi)
        db.session.commit()
        return jsonify({'message': 'POI deleted successfully'}), 200
    except Exception:
        db.session.rollback()
        handle_unexpected_error('deleting POI')


@api.route('/countries', methods=['POST'])
def create_country():
    """
    Create one or more countries.
    Args:
        None.
    Body:
        - name (str): Country name (unique).
        - img (str): Country image URL.
    Raises:
        APIException: If a country with the same name already exists or a database error occurs.
    Returns:
        Response: JSON with the created countries and a success message.
    """
    body = request.get_json()
    items = normalize_body_to_list(body)
    created = []
    seen_keys = set()
    for item in items:
        name = item.get('name')
        require_body_fields(item, ['name', 'img'], item_name=name)
        key = name
        if key in seen_keys:
            raise APIException(f"Duplicate entry: {key}", status_code=400)
        seen_keys.add(key)
        existing_country = Country.query.filter_by(name=name).first()
        if existing_country:
            raise APIException(
                f'Country {name} already exists', status_code=400)
        country = Country(id=str(uuid.uuid4()), name=name, img=item.get('img'))
        created.append(country)
    try:
        db.session.add_all(created)
        db.session.commit()
        return jsonify({'message': 'Countries created successfully', 'created': [country.serialize() for country in created]}), 201
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.warning(
            f"Integrity error on create country: {str(e.orig)}")
        raise APIException("Database integrity error", status_code=400)
    except Exception:
        db.session.rollback()
        handle_unexpected_error('creating countries')


@api.route('/countries/<string:country_name>', methods=['PUT'])
def update_country(country_name):
    """
    Update a country by its name.
    Args:
        country_name (str): Current country name.
    Body:
        - name (str, optional): New country name.
        - img (str, optional): New image URL.
    Raises:
        APIException: If the country does not exist, the new name conflicts, or a database error occurs.
    Returns:
        Response: JSON with the updated country.
    """
    country = get_object_or_404(Country, unique_field_value=country_name,
                                not_found_message='Country not found', field_name='name')
    body = request.get_json()
    body = require_json_object(body, context='updating country')
    allowed_fields = COUNTRY_ALLOWED_FIELDS
    provided_keys = set(body.keys())
    if not provided_keys or not provided_keys.issubset(allowed_fields):
        raise APIException('No valid fields supplied', status_code=400)
    if 'name' in body and body.get('name'):
        existing = Country.query.filter(Country.name == body.get(
            'name'), Country.id != country.id).first()
        if existing:
            raise APIException('Country name already exists', status_code=400)
        country.name = body.get('name')
    if 'img' in body and body.get('img'):
        country.img = body.get('img')
    try:
        db.session.commit()
        return jsonify({'message': 'Country updated successfully', 'country': country.serialize()}), 200
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.warning(
            f"Integrity error on update country: {str(e.orig)}")
        raise APIException("Database integrity error", status_code=400)
    except Exception:
        db.session.rollback()
        handle_unexpected_error('updating country')


@api.route('/countries/<string:country_name>', methods=['DELETE'])
def delete_country(country_name):
    """
    Delete a country by its name.
    Args:
        country_name (str): Country name.
    Body:
        None.
    Raises:
        APIException: If the country does not exist or a database error occurs.
    Returns:
        Response: JSON with success message.
    """
    country = get_object_or_404(Country, unique_field_value=country_name,
                                not_found_message='Country not found', field_name='name')
    try:
        db.session.delete(country)
        db.session.commit()
        return jsonify({'message': 'Country deleted successfully'}), 200
    except Exception:
        db.session.rollback()
        handle_unexpected_error('deleting country')


@api.route('/cities', methods=['POST'])
def create_city():
    """
    Create one or more cities.
    Args:
        None.
    Body:
        - name (str): City name.
        - season (str): Preferred season.
        - country_name (str): Country name.
    Raises:
        APIException: If the provided country does not exist, a duplicate name exists in the same country, or a database error occurs.
    Returns:
        Response: JSON with the created cities and a success message.
    """
    body = request.get_json()
    items = normalize_body_to_list(body)

    created = []
    seen_keys = set()
    for item in items:
        name = item.get('name')
        require_body_fields(
            item, ['name', 'season', 'country_name'], item_name=name)
        key = f"{name}:{item.get('country_name')}"
        if key in seen_keys:
            raise APIException(f"Duplicate entry: {key}", status_code=400)
        seen_keys.add(key)
        country = get_object_or_404(
            Country,
            unique_field_value=item.get('country_name'),
            not_found_message='Country not found',
            field_name='name'
        )
        existing = City.query.filter_by(
            name=name, country_id=country.id).first()
        if existing:
            raise APIException(
                f"City '{name}' already exists in this country", status_code=400)
        city = City(
            id=str(uuid.uuid4()),
            name=name,
            season=item.get('season'),
            country_id=country.id
        )
        created.append(city)
    try:
        db.session.add_all(created)
        db.session.commit()
        return jsonify({'message': 'Cities created successfully',
                        'created': [city.serialize() for city in created]}), 201
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.warning(
            f"Integrity error on create city: {str(e.orig)}")
        raise APIException("Database integrity error", status_code=400)
    except Exception:
        db.session.rollback()
        handle_unexpected_error('creating cities')


@api.route('/cities/<string:city_id>', methods=['PUT'])
def update_city(city_id):
    """
    Update a city by its ID.
    Args:
        city_id (str): City ID.
    Body:
        - name (str, optional): City name.
        - img (str, optional): City image URL.
        - season (str, optional): Preferred season.
        - country_id (str, optional): Country ID.
    Raises:
        APIException: If the city or provided country does not exist, or a database error occurs.
    Returns:
        Response: JSON with the updated city.
    """
    city = get_object_or_404(
        City, unique_field_value=city_id, not_found_message='City not found')
    body = request.get_json()
    body = require_json_object(body, context='updating city')
    allowed_fields = CITY_ALLOWED_FIELDS
    provided_keys = set(body.keys())
    if not provided_keys or not provided_keys.issubset(allowed_fields):
        raise APIException('No valid fields supplied', status_code=400)

    # Determine prospective new values
    current_name = city.name
    current_country_id = city.country_id
    new_country_id = current_country_id
    if 'country_id' in body and body.get('country_id'):
        country = get_object_or_404(
            Country,
            unique_field_value=body.get('country_id'),
            not_found_message='Country not found')
        new_country_id = country.id
    new_name = body.get('name', current_name)

    # Check for existing city with same name and country
    if new_name != current_name or new_country_id != current_country_id:
        existing_city = City.query.filter_by(
            name=new_name, country_id=new_country_id).first()
        if existing_city and existing_city.id != city.id:
            raise APIException('City already exists in this country', 400)

    # Apply updates
    if 'country_id' in body and body.get('country_id'):
        city.country_id = new_country_id
    if 'name' in body and body.get('name'):
        city.name = new_name
    if 'img' in body and body.get('img'):
        city.img = body.get('img')
    if 'season' in body and body.get('season'):
        city.season = body.get('season')
    try:
        db.session.commit()
        return jsonify({'message': 'City updated successfully', 'city': city.serialize()}), 200
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.warning(
            f"Integrity error on update city: {str(e.orig)}")
        raise APIException("Database integrity error", status_code=400)
    except Exception:
        db.session.rollback()
        handle_unexpected_error('updating city')


@api.route('/cities/<string:city_id>', methods=['DELETE'])
def delete_city(city_id):
    """
    Delete a city by its ID.
    Args:
        city_id (str): City ID.
    Body:
        None.
    Raises:
        APIException: If the city does not exist or a database error occurs.
    Returns:
        Response: JSON with success message.
    """
    city = get_object_or_404(
        City, unique_field_value=city_id, not_found_message='City not found')
    try:
        db.session.delete(city)
        db.session.commit()
        return jsonify({'message': 'City deleted successfully'}), 200
    except Exception:
        db.session.rollback()
        handle_unexpected_error('deleting city')


@api.route('/poiimages', methods=['GET'])
def list_poi_images():
    """
    List all POI images.
    Args:
        None.
    Body:
        None.
    Raises:
        APIException: If an unexpected error occurs.
    Returns:
        Response: JSON list of POI images. Returns an empty list if none are found.
    """
    try:
        images = PoiImage.query.all()
        return jsonify({'message': 'POI images retrieved successfully', 'images': [img.serialize() for img in images]}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('listing POI images')


@api.route('/poiimages/<string:image_id>', methods=['DELETE'])
def delete_poi_image(image_id):
    """
    Delete a POI image by its ID.
    Args:
        image_id (str): POI image ID.
    Body:
        None.
    Raises:
        APIException: If the POI image is not found.
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


@api.route('/<string:country_name>/cities', methods=['GET'])
def get_cities_by_country(country_name):
    """
    Retrieve all cities within a given country.
    Args:
        country_name (str): Country name.
    Body:
        None.
    Raises:
        APIException: If the country does not exist or an unexpected error occurs.
    Returns:
        Response: JSON list of cities. Returns an empty list if none are found.
    """
    try:
        country = get_object_or_404(
            Country,
            unique_field_value=country_name,
            not_found_message='Country not found',
            field_name='name'
        )
        cities = City.query.filter_by(country_id=country.id).all()
        return jsonify({'message': 'Cities retrieved successfully', 'cities': [city.serialize() for city in cities]}), 200
    except APIException:
        raise
    except Exception:
        handle_unexpected_error('retrieving cities by country')
