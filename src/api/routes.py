from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Poi, Country, City, Favorite
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
import uuid

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

@api.route('/register', methods=['POST'])
def register():
    body = request.get_json()
    name = body.get('name')
    user_name = body.get('user_name')
    email = body.get('email')
    password = body.get('password')
    birth_date = body.get('birth_date')
    location = body.get('location')
    role = 'user'

    if not email or not password or not user_name or not birth_date or not name:
        raise APIException('Name, user_name, email, password, and birth_date are required', status_code=400)
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
    
    return jsonify({'message': 'User registered successfully'}), 201

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
    if password != user.password:
        raise APIException('Invalid password', status_code=401)
    
    access_token = create_access_token(identity=user.id)
    return jsonify({'access_token': access_token}), 200

@api.route('/myProfile', methods=['GET'])
@jwt_required()
def my_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        raise APIException('Authentication failed', status_code=404)

    return jsonify({user.serialize()}), 200

@api.route('/myProfile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        raise APIException('Authentication failed', status_code=404)

    body = request.get_json()
    user_name = body.get('user_name')
    email = body.get('email')
    location = body.get('location')
    password = body.get('password')

    if email:
        existing_user = User.query.filter_by(email=email).first()
        if existing_user and existing_user.id != user.id:
            raise APIException('Email already in use', status_code=400)
        user.email = email
    if user_name:
        existing_user = User.query.filter_by(user_name=user_name).first()
        if existing_user and existing_user.id != user.id:
            raise APIException('Username already in use', status_code=400)
        user.user_name = user_name
    if password:
        user.password = password
    if location:
        user.location = location

    try:
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/favorites', methods=['GET'])
@jwt_required()
def favorites():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        raise APIException('Authentication failed', status_code=404)
    
    try:
        favorites = user.favorites
        return jsonify({'favorites': [Poi.query.get(fav.poi_id).serialize() for fav in favorites]}), 200
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/favorites', methods=['POST'])
@jwt_required()
def add_favorite():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        raise APIException('Authentication failed', status_code=404)

    body = request.get_json()
    poi_id = body.get('poi_id')

    if not poi_id:
        raise APIException('POI ID is required', status_code=400)
    poi = Poi.query.get(poi_id)
    if not poi:
        raise APIException('Point of interest not found', status_code=404)
    existing_favorite = Favorite.query.filter_by(user_id=user.id, poi_id=poi.id).first()
    if existing_favorite:
        raise APIException('Point of interest is already in favorites', status_code=400)

    try:
        favorite = Favorite(user=user, poi=poi)
        db.session.add(favorite)
        db.session.commit()
        return jsonify({'message': 'Favorite added successfully'}), 201
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/favorites', methods=['DELETE'])
def remove_favorite():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        raise APIException('Authentication failed', status_code=404)

    body = request.get_json()
    poi_id = body.get('poi_id')

    if not poi_id:
        raise APIException('POI ID is required', status_code=400)
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
    try:
        pois = Poi.query.all()
        if pois:
            return jsonify([poi.serialize() for poi in pois]), 200
        else:
            return jsonify({'message': 'No points of interest found'}), 404
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/pois', methods=['POST'])
def create_poi():
    body = request.get_json()
    if isinstance(body, dict):
        items = [body]
    elif isinstance(body, list):
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
        if not name or not description or not latitude or not longitude or not city_id:
            raise APIException('Name, description, latitude, longitude, and city_id are required', status_code=400)
        id = str(uuid.uuid4())
        poi = Poi(id=id, name=name, description=description, latitude=latitude, longitude=longitude, img=img, city_id=city_id)
        created.append(poi)

    try:
        db.session.add_all(created)
        db.session.commit()
        return jsonify({'created': [city.serialize() for city in created]}), 201
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/pois', methods=['PUT'])
def edit_poi():
    body = request.get_json()
    poi_id = body.get('id')
    name = body.get('name')
    description = body.get('description')
    latitude = body.get('latitude')
    longitude = body.get('longitude')
    img = body.get('img')
    city_id = body.get('city_id')

    if not poi_id:
        raise APIException('POI ID is required', status_code=400)
    poi = Poi.query.get(poi_id)
    if not poi:
        raise APIException('Point of interest not found', status_code=404)

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
        return jsonify({'message': 'Point of interest updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)
    
@api.route('/pois', methods=['DELETE'])
def delete_poi():
    body = request.get_json()
    poi_id = body.get('id')

    if not poi_id:
        raise APIException('POI ID is required', status_code=400)
    poi = Poi.query.get(poi_id)
    if not poi:
        raise APIException('Point of interest not found', status_code=404)

    try:
        db.session.delete(poi)
        db.session.commit()
        return jsonify({'message': 'Point of interest deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)
    
@api.route('/countries', methods=['GET'])
def get_countries():
    try:
        countries = Country.query.all()
        if countries:
            return jsonify([country.serialize() for country in countries]), 200
        else:
            return jsonify({'message': 'No countries found'}), 404
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)
        
@api.route('/countries', methods=['POST'])
def create_country():
    body = request.get_json()
    if isinstance(body, dict):
        items = [body]
    elif isinstance(body, list):
        items = body
    else:
        raise APIException('Invalid input format', status_code=400)

    created = []
    for item in items:
        name = item.get('name')
        img = item.get('img')

        if not name or not img:
            raise APIException('Name and img are required', status_code=400)
        id = str(uuid.uuid4())
        country = Country(id=id, name=name, img=img)
        created.append(country)
    try:
        db.session.add_all(created)
        db.session.commit()
        return jsonify({'created': [country.serialize() for country in created]}), 201
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)
    
@api.route('/countries', methods=['PUT'])
def edit_country():
    body = request.get_json()
    country_id = body.get('id')
    name = body.get('name')
    img = body.get('img')

    if not country_id:
        raise APIException('Country ID is required', status_code=400)
    country = Country.query.get(country_id)
    if not country:
        raise APIException('Country not found', status_code=404)
    
    if name:
        country.name = name
    if img:
        country.img = img
    try:
        db.session.commit()
        return jsonify({'message': 'Country updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)
    
@api.route('/countries', methods=['DELETE'])
def delete_country():
    body = request.get_json()
    country_id = body.get('id')

    if not country_id:
        raise APIException('Country ID is required', status_code=400)
    country = Country.query.get(country_id)
    if not country:
        raise APIException('Country not found', status_code=404)

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
    
@api.route('/cities', methods=['POST'])
def create_city():
    body = request.get_json()
    if isinstance(body, dict):
        items = [body]
    elif isinstance(body, list):
        items = body
    else:
        raise APIException('Invalid input format', status_code=400)

    created = []
    for item in items:
        name = item.get('name')
        img = item.get('img')
        climate = item.get('climate')
        country_id = item.get('country_id')
        if not name or not img or not climate or not country_id:
            raise APIException('Name, img, climate and country_id are required', status_code=400)
        
        id = str(uuid.uuid4())
        city = City(id=id, name=name, img=img, climate=climate, country_id=country_id)
        created.append(city)

    try:
        db.session.add_all(created)
        db.session.commit()
        return jsonify({'created': [city.serialize() for city in created]}), 201
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)
    
@api.route('/cities', methods=['PUT'])
def edit_city():
    body = request.get_json()
    city_id = body.get('id')
    name = body.get('name')
    img = body.get('img')
    climate = body.get('climate')
    country_id = body.get('country_id')

    if not city_id:
        raise APIException('City ID is required', status_code=400)

    city = City.query.get(city_id)
    if not city:
        raise APIException('City not found', status_code=404)

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
        return jsonify({'message': 'City updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/cities', methods=['DELETE'])
def delete_city():
    body = request.get_json()
    city_id = body.get('id')

    if not city_id:
        raise APIException('City ID is required', status_code=400)

    city = City.query.get(city_id)
    if not city:
        raise APIException('City not found', status_code=404)

    try:
        db.session.delete(city)
        db.session.commit()
        return jsonify({'message': 'City deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        raise APIException("Server error: " + str(e), status_code=500)

@api.route('/popular-pois', methods=['GET'])
def get_popular_pois():
    try:
        pois = Poi.query.order_by(db.func.random()).limit(20).all()
        if pois:
            return jsonify([poi.serialize() for poi in pois]), 200
        else:
            return jsonify({'message': 'No points of interest found'}), 404
    except Exception as e:
        raise APIException("Server error: " + str(e), status_code=500)