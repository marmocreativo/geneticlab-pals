# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL=https://xwtsnaaokbanofvynkcu.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3dHNuYWFva2Jhbm9mdnlua2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjIzNzcsImV4cCI6MjA3NjczODM3N30.9D1yU3l7Ys05wjuetQt1rB-Oy4tCEJcvPY9QrM6_ulE
ARG VITE_GOOGLE_MAPS_API_KEY=AIzaSyAltWSwwSpyp2Yg1CfxKtY6LBq7574l2dM

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

RUN npm run build

# Stage 2: serve
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]