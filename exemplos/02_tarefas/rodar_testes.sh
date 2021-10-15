#!/bin/bash

set -e

export DATABASE_URL='postgres://postgres:postgres@localhost:5432/testes'
npx knex --esm migrate:latest
NODE_OPTIONS=--experimental-vm-modules npx jest
