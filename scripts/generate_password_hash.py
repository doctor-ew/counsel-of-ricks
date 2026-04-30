#!/usr/bin/env python3
"""Generate a bcrypt password hash for the app password."""

import sys

import bcrypt


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_password_hash.py <password>")
        print("\nThis generates a bcrypt hash for the PASSWORD_HASH environment variable.")
        sys.exit(1)

    password = sys.argv[1]
    hash_value = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    print(f"\nPassword hash generated successfully!\n")
    print(f"Add this to your environment variables:\n")
    print(f"PASSWORD_HASH={hash_value}\n")


if __name__ == "__main__":
    main()
