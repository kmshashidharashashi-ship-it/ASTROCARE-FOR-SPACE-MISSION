"""
ASTRACARE – Tests for Authentication and Role-based Authorization.
"""

from __future__ import annotations

import pytest


class TestAuthAPI:
    def test_register_new_user_success(self, client):
        payload = {
            "email": "dr.smith@astrocare.space",
            "password": "SecurePassword123!",
            "full_name": "Dr. Eleanor Smith",
            "role": "Flight Surgeon",
            "callsign": "SURGEON-ALPHA",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "dr.smith@astrocare.space"
        assert data["full_name"] == "Dr. Eleanor Smith"
        assert data["role"] == "Flight Surgeon"
        assert "hashed_password" not in data

    def test_register_duplicate_email_rejected(self, client):
        payload = {
            "email": "commander@astrocare.space",
            "password": "Password123!",
            "full_name": "Commander Test",
            "role": "Mission Commander",
        }
        res1 = client.post("/api/auth/register", json=payload)
        assert res1.status_code == 201

        # Second attempt should return 400 Bad Request, not 500!
        res2 = client.post("/api/auth/register", json=payload)
        assert res2.status_code == 400
        assert "already registered" in res2.json()["detail"]

    def test_register_short_password_rejected(self, client):
        payload = {
            "email": "short@astrocare.space",
            "password": "123",  # Under 6 chars
            "full_name": "Short Pwd",
        }
        res = client.post("/api/auth/register", json=payload)
        assert res.status_code == 422

    def test_login_successful(self, client):
        # Register user
        reg_payload = {
            "email": "officer@astrocare.space",
            "password": "MissionSecret456!",
            "full_name": "Officer Patel",
            "role": "Medical Officer",
        }
        client.post("/api/auth/register", json=reg_payload)

        # Login
        login_payload = {
            "email": "officer@astrocare.space",
            "password": "MissionSecret456!",
        }
        response = client.post("/api/auth/login", json=login_payload)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "officer@astrocare.space"

    def test_login_invalid_password_rejected(self, client):
        reg_payload = {
            "email": "user@astrocare.space",
            "password": "RealPassword789!",
            "full_name": "Real User",
            "role": "Mission Analyst",
        }
        client.post("/api/auth/register", json=reg_payload)

        login_payload = {
            "email": "user@astrocare.space",
            "password": "WrongPassword!",
        }
        response = client.post("/api/auth/login", json=login_payload)
        assert response.status_code == 401
        assert "Incorrect" in response.json()["detail"]

    def test_get_me_with_jwt_token(self, client):
        reg_payload = {
            "email": "analyst@astrocare.space",
            "password": "AnalystPass2026!",
            "full_name": "Analyst Test",
            "role": "Mission Analyst",
        }
        client.post("/api/auth/register", json=reg_payload)

        login_res = client.post("/api/auth/login", json={
            "email": "analyst@astrocare.space",
            "password": "AnalystPass2026!",
        })
        token = login_res.json()["access_token"]

        me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "analyst@astrocare.space"

    def test_get_me_unauthorized_without_token(self, client):
        res = client.get("/api/auth/me")
        assert res.status_code == 401
