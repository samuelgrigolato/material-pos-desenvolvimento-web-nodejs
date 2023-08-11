#!/bin/bash

set -e

export DATABASE_URL='postgres://postgres:postgres@localhost:5432/testes'
export JWT_SECRET='123456'
npx knex migrate:latest
npx jest
