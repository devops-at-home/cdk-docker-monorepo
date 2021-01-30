#!/bin/bash

docker version

CONTAINERS=`git log -1 --stat --oneline | grep VERSION`

if [ -z "$CONTAINERS" ]; then
  echo "No containers to build"
  exit 0
fi
