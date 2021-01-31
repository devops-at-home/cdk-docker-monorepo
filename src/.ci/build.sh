#!/bin/bash

docker version

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

  echo Building the amd64 Docker image on `date`
  docker buildx build \
    --platform linux/amd64 \
    --output "type=image,push=true"        
    --tag $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest-amd64
    --tag $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION-amd64 \
  
  echo Building the arm64 Docker image on `date`
  docker buildx build \
    --platform linux/arm64 \
    --output "type=image,push=true"        
    --tag $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest-arm64
    --tag $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION-arm64 \

  echo Building the Docker manifest on `date` 
  docker manifest create $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest-arm64 $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest-amd64    
  docker manifest annotate --arch arm64 $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest-arm64
  docker manifest annotate --arch amd64 $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest-amd64
  docker manifest create $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION-arm64 $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION-amd64    
  docker manifest annotate --arch arm64 $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION-arm64
  docker manifest annotate --arch amd64 $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:$VERSION-amd64
  docker manifest push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY
  docker manifest inspect $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY
done;

put_param
