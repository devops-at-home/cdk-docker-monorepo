#!/bin/bash

IMAGE='hello-kubernetes'
IMAGE_VERSION=`cat VERSION`

docker build . --no-cache \
  --build-arg IMAGE_VERSION="${IMAGE_VERSION}" \
  --build-arg IMAGE_CREATE_DATE="`date -u +"%Y-%m-%dT%H:%M:%SZ"`" \
  --build-arg IMAGE_SOURCE_REVISION="`git rev-parse HEAD`" \
  -t "${IMAGE}:${IMAGE_VERSION}"
