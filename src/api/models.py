from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column
from typing import List

db = SQLAlchemy()


class User(db.Model):
    """Represents a registered user.

    Stores authentication details and relations to favorite and visited
    points of interest.
    """
    __tablename__ = 'user'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    user_name: Mapped[str] = mapped_column(
        String(30), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    birth_date: Mapped[datetime] = mapped_column(nullable=False)
    location: Mapped[str] = mapped_column(String(120), nullable=True)
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default='user')
    img: Mapped[str] = mapped_column(String(240), nullable=True)
    favorites: Mapped[List["Favorite"]] = db.relationship(
        'Favorite', back_populates='user', cascade='all, delete-orphan')
    visited: Mapped[List["Visited"]] = db.relationship(
        'Visited', back_populates='user', cascade='all, delete-orphan')

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "user_name": self.user_name,
            "email": self.email,
            "birth_date": self.birth_date.isoformat() if self.birth_date else None,
            "location": self.location,
            "img": self.img,
            "favorites": [fav.poi_id for fav in self.favorites],
            "visited": [vis.poi_id for vis in self.visited]
        }


class Country(db.Model):
    """Country where points of interest are located.

    Holds the country's basic information and its related cities.
    """
    __tablename__ = 'country'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    img: Mapped[str] = mapped_column(String(240), nullable=False)
    cities: Mapped[List["City"]] = db.relationship(
        'City', back_populates='country', cascade='all, delete-orphan')

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "img": self.img,
            "cities": [city.id for city in self.cities]
        }


class City(db.Model):
    """City belonging to a country.

    Aggregates points of interest and links back to its country.
    """
    __tablename__ = 'city'
    __table_args__ = (
        db.UniqueConstraint('name', 'country_id', name='uq_city_name_country'),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    season: Mapped[str] = mapped_column(String(120), nullable=False)
    country_id: Mapped[str] = mapped_column(
        db.ForeignKey('country.id'), nullable=False)
    country: Mapped["Country"] = db.relationship(
        'Country', back_populates='cities')
    pois: Mapped[List["Poi"]] = db.relationship(
        'Poi', back_populates='city', cascade='all, delete-orphan')

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "season": self.season,
            "country_id": self.country_id,
            "pois": [poi.id for poi in self.pois]
        }


class PoiTag(db.Model):
    """Association table linking POIs with tags."""
    __tablename__ = 'poi_tag'
    poi_id: Mapped[str] = mapped_column(
        db.ForeignKey('poi.id'), primary_key=True)
    tag_id: Mapped[str] = mapped_column(
        db.ForeignKey('tag.id'), primary_key=True)
    poi: Mapped["Poi"] = db.relationship('Poi', back_populates='poi_tags')
    tag: Mapped["Tag"] = db.relationship('Tag', back_populates='poi_tags')


class Tag(db.Model):
    """Descriptive label that can be attached to POIs."""
    __tablename__ = 'tag'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(240), nullable=False, unique=True)
    poi_tags: Mapped[List["PoiTag"]] = db.relationship(
        'PoiTag', back_populates='tag', cascade='all, delete-orphan')

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name
        }


class Poi(db.Model):
    """Point of interest within a city.

    Contains location data and relations to images, tags, favorites and
    visited records.
    """
    __tablename__ = 'poi'
    __table_args__ = (
        db.UniqueConstraint('name', 'city_id', name='uq_poi_name_city'),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    city_id: Mapped[str] = mapped_column(
        db.ForeignKey('city.id'), nullable=False)
    city: Mapped["City"] = db.relationship('City', back_populates='pois')
    images: Mapped[List["PoiImage"]] = db.relationship(
        'PoiImage', back_populates='poi', cascade='all, delete-orphan')
    poi_tags: Mapped[List["PoiTag"]] = db.relationship(
        'PoiTag', back_populates='poi', cascade='all, delete-orphan')
    favorited_by: Mapped[List["Favorite"]] = db.relationship(
        'Favorite', back_populates='poi', cascade='all, delete-orphan')
    visited_by: Mapped[List["Visited"]] = db.relationship(
        'Visited', back_populates='poi', cascade='all, delete-orphan')

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "city_id": self.city_id,
            "images": [img.url for img in self.images],
            "tags": [pt.tag.name for pt in self.poi_tags]
        }


class PoiImage(db.Model):
    """Image URL associated with a specific POI."""
    __tablename__ = 'poi_image'
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    url: Mapped[str] = mapped_column(String(240), nullable=False)
    poi_id: Mapped[str] = mapped_column(
        db.ForeignKey('poi.id'), nullable=False)
    poi: Mapped["Poi"] = db.relationship('Poi', back_populates='images')

    def serialize(self):
        return {
            "id": self.id,
            "url": self.url,
            "poi_id": self.poi_id
        }


class Favorite(db.Model):
    """Join table mapping users to their favorite POIs."""
    __tablename__ = 'favorite'
    user_id: Mapped[str] = mapped_column(db.ForeignKey(
        'user.id'), nullable=False, primary_key=True)
    poi_id: Mapped[str] = mapped_column(db.ForeignKey(
        'poi.id'), nullable=False, primary_key=True)
    user: Mapped["User"] = db.relationship('User', back_populates='favorites')
    poi: Mapped["Poi"] = db.relationship('Poi', back_populates='favorited_by')

    def serialize(self):
        return {
            "user_id": self.user_id,
            "poi_id": self.poi_id
        }


class Visited(db.Model):
    """Join table mapping users to POIs they have visited."""
    __tablename__ = 'visited'
    user_id: Mapped[str] = mapped_column(db.ForeignKey(
        'user.id'), nullable=False, primary_key=True)
    poi_id: Mapped[str] = mapped_column(db.ForeignKey(
        'poi.id'), nullable=False, primary_key=True)
    user: Mapped["User"] = db.relationship('User', back_populates='visited')
    poi: Mapped["Poi"] = db.relationship('Poi', back_populates='visited_by')

    def serialize(self):
        return {
            "user_id": self.user_id,
            "poi_id": self.poi_id
        }
