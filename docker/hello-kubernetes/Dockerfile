FROM alpine:latest AS src

WORKDIR /tmp

RUN apk add curl wget jq \
&& curl -s https://api.github.com/repos/paulbouwer/hello-kubernetes/releases/latest \
| jq -r '.tarball_url' \
| wget -qi- -O- \
| tar -xzvf - --strip-components=1

#rm -rf /var/lib/apk /var/cache/apk

FROM node:16-alpine3.13

ARG IMAGE_CREATE_DATE
ARG IMAGE_VERSION
ARG IMAGE_SOURCE_REVISION

# Metadata as defined in OCI image spec annotations - https://github.com/opencontainers/image-spec/blob/master/annotations.md
LABEL org.opencontainers.image.title="Hello Kubernetes!" \
      org.opencontainers.image.description="Provides a demo app to deploy to a Kubernetes cluster. It displays a message, the name of the pod and details of the node it is deployed to." \
      org.opencontainers.image.created=$IMAGE_CREATE_DATE \
      org.opencontainers.image.version=$IMAGE_VERSION \
      org.opencontainers.image.authors="Paul Bouwer" \
      org.opencontainers.image.url="https://hub.docker.com/r/paulbouwer/hello-kubernetes/" \
      org.opencontainers.image.documentation="https://github.com/paulbouwer/hello-kubernetes/README.md" \
      org.opencontainers.image.vendor="Paul Bouwer" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/paulbouwer/hello-kubernetes.git" \
      org.opencontainers.image.revision=$IMAGE_SOURCE_REVISION 

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY --from=src /tmp/src/app /usr/src/app
RUN npm install


USER node
CMD [ "npm", "start" ]
