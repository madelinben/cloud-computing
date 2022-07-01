FROM alpine
RUN apk add --update nodejs npm python2 make g++
RUN rm -rf /var/cache/apk/*
WORKDIR /usr/src/app
EXPOSE 3000
COPY week3-seminar/ .
RUN ls -la /usr/src/app/*
RUN npm install zeromq@5 express
RUN npm install pm2 -g
#CMD ["/bin/sh", "-c" , "sleep infinity" ]
CMD ["pm2-runtime","dist-example.js" ]
