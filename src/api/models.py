from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from typing import List

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'user'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    user_name: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    birth_date: Mapped[datetime] = mapped_column(nullable=False)
    location: Mapped[str] = mapped_column(String(120), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default='user')

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "user_name": self.user_name,
            "email": self.email,
            "birth_date": self.birth_date,
            "location": self.location,
            "role": self.role
        }

class Country(db.Model):
    __tablename__ = 'country'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    img: Mapped[str] = mapped_column(String(240), nullable=False)
    cities: Mapped[List["City"]] = db.relationship('City', back_populates='country', cascade='all, delete-orphan')
    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "img": self.img,
            "cities": [city.serialize() for city in self.cities]
        }

class City(db.Model):
    __tablename__ = 'city'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    img: Mapped[str] = mapped_column(String(240), nullable=False)
    climate: Mapped[str] = mapped_column(String(120), nullable=False)
    country_id: Mapped[str] = mapped_column(
        db.ForeignKey('country.id'), nullable=False)
    country: Mapped["Country"] = db.relationship('Country', back_populates='cities')
    pois: Mapped[List["Poi"]] = db.relationship('Poi', back_populates='city', cascade='all, delete-orphan')
    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "img": self.img,
            "climate": self.climate,
            "country_id": self.country_id,
            "pois": [poi.serialize() for poi in self.pois] 
        }

class Poi(db.Model):
    __tablename__ = 'poi'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[str] = mapped_column(nullable=False)
    longitude: Mapped[str] = mapped_column(nullable=False)
    img: Mapped[str] = mapped_column(String(240), nullable=False)
    city_id: Mapped[str] = mapped_column(
        db.ForeignKey('city.id'), nullable=False)
    city: Mapped["City"] = db.relationship('City', back_populates='pois')
    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "img": self.img,
            "city_id": self.city_id,
        }

class Favorite(db.Model):
    __tablename__ = 'favorite'
    user_id: Mapped[int] = mapped_column(db.ForeignKey('user.id'), nullable=False, primary_key=True)
    poi_id: Mapped[int] = mapped_column(db.ForeignKey('poi.id'), nullable=False, primary_key=True)
    user: Mapped["User"] = db.relationship('User', backref='favorites')
    poi: Mapped["Poi"] = db.relationship('Poi', backref='favorited_by')

    def serialize(self):
        return {
            "user_id": self.user_id,
            "poi_id": self.poi_id
        }