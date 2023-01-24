name: Push Main

on:
  push:
    branches: [ main, docker ]

jobs:
  docker:
    runs-on: ubuntu-latest
    name: Build And Push to Docker Hub
    steps:
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v3
        with:
          push: true
          tags: hicsail/damplab-backend:unstable

      - name: Push to Staging
        uses: fjogeleit/http-request-action@v1
        with:
          method: 'POST'
          url: ${{ secrets.PORTAINER_WEBHOOK }}
          preventFailureOnNoResponse: true