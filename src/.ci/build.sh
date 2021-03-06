#!/bin/bash

GIT_SHA=`git rev-parse HEAD`

function put_param () {
  echo "Set git sha and exit"
  aws ssm put-parameter \
    --name "/codebuild/state/docker-monorepo/prev-git-sha" \
    --type "String" \
    --value "$GIT_SHA"\
    --overwrite
  exit 0
}

function build_docker_image () {
  echo Building the $ARCH Docker image on `date`
  docker buildx build /code/src/$ECR_REPOSITORY \
    --platform linux/$ARCH \
    --output "type=image,push=true" \    
    --tag $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest-$ARCH \
    --tag $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION-$ARCH
}

if [ "$PREV_GIT_SHA" == "1234" ]; then
  put_param
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

  # From: https://aws.amazon.com/blogs/devops/creating-multi-architecture-docker-images-to-support-graviton2-using-aws-codebuild-and-aws-codepipeline/
  # And: https://docs.docker.com/docker-for-mac/multi-arch/
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest \
    --tag $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION \
    --push \
    src/$ECR_REPOSITORY

done;

put_param
