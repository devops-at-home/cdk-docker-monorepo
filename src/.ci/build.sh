#!/bin/bash

docker version

GIT_SHA=`git rev-parse HEAD`

if [ "$PREV_GIT_SHA" == "1234" ]; then
  echo "Set git sha and exit"
  aws ssm put-parameter \
    --name "/codebuild/state/docker-monorepo/prev-git-sha" \
    --type "String" \
    --value "$GIT_SHA"\
    --overwrite
  exit 0
fi

for VERSION_FILE_PATH in $(git diff-tree --no-commit-id --name-only -r "$GIT_SHA" "$PREV_GIT_SHA" | grep "VERSION");
do
  FOLDER=${VERSION_FILE_PATH%"/VERSION"}
  ECR_REPOSITORY=${FOLDER##*/}
  if [ ! -f "${VERSION_FILE_PATH}" ]; then
    echo "${VERSION_FILE_PATH} not found!"
    continue
  fi
  VERSION=$(cat $VERSION_FILE_PATH)

  echo ECR_REPOSITORY=$ECR_REPOSITORY
  echo VERSION=$VERSION
done;
