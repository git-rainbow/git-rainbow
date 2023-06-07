FROM python:3.9

RUN mkdir /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN pip3 install -r requirements.txt

RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get update \
    && apt-get install -y --no-install-recommends gettext nodejs apt-utils

RUN cd utils/github_calendar && npm install
RUN npm install uglifycss -g
RUN uglifycss static/css/tailwind.clean.css > static/css/tailwind.output.css \
    && uglifycss static/css/tech_stack.css > static/css/tech_stack.output.css \
    && uglifycss static/css/profile.css > static/css/profile.output.css

RUN apt-get clean \
    && rm -rf /var/lib/apt/lists/*

CMD ["python3", "-m", "gunicorn", "--bind", ":8000", "--workers", "2", "config.wsgi:application"]