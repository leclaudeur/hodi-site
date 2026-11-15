# ==========================================
# Build stage: Astro writes every page of the site into dist/.
# ==========================================
# The pages are the same on every processor: build them once, on the machine that builds the image.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build

WORKDIR /app

# Install dependencies first to improve Docker layer caching.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# Runtime stage: nginx serves the pages as plain files, and sends Village's public routes on to Hodi.
# ==========================================
FROM nginx:1.30-alpine

# Links the image on GitHub's registry to this repository.
LABEL org.opencontainers.image.source=https://github.com/leclaudeur/hodi-site

# Hodi's address inside the stack: the service named app (as in Hodi's compose.yml), on its port 3000. nginx's image writes it into the
# configuration at start.
ENV HODI_URL=http://app:3000

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/robots.txt || exit 1
