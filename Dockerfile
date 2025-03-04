FROM node:22

RUN mkdir /app
WORKDIR /app
CMD [ "./boot" ]
