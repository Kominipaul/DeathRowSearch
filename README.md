# Deathrow Search Engine Setup Guide

This guide outlines the steps to set up your **Deathrow Search Engine** using Elasticsearch with Docker as the database and Node.js with Express.js as the backend.

---

## Prerequisites

Before you begin, ensure the following are installed on your system:

- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/) (version 16 or higher recommended)
- [Git](https://git-scm.com/)

## Step 1: Setting Up Elasticsearch with Docker

### 1.1 Install Docker

Visit [Get Docker](https://www.docker.com/products/docker-desktop) to install Docker for your environment. If using Docker Desktop, ensure you allocate at least **4GB of memory**. You can adjust memory usage in Docker Desktop by navigating to **Settings > Resources**.

### 1.2 Create a Docker Network

Create a new Docker network named `elastic`:

```bash
docker network create elastic
```

### 1.3 Pull the Elasticsearch Docker Image

Run the following command to pull the Elasticsearch Docker image:

```bash
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.17.0
```

### 1.4 Verify the Elasticsearch Image (Optional)

Install [Cosign](https://github.com/sigstore/cosign) for your environment and verify the Elasticsearch image signature:

```bash
wget https://artifacts.elastic.co/cosign.pub
cosign verify --key cosign.pub docker.elastic.co/elasticsearch/elasticsearch:8.17.0
```

You should see output confirming the validity of the signature.

### 1.5 Start an Elasticsearch Container

Run the Elasticsearch container with the necessary configurations:

```bash
docker run --name es01 --net elastic -p 9200:9200 -it -m 1GB docker.elastic.co/elasticsearch/elasticsearch:8.17.0
```

Alternatively, if you plan to use machine learning features, allocate more memory (e.g., 6GB) and enable automatic memory allocation:

```bash
docker run --name es01 --net elastic -p 9200:9200 -it -m 6GB -e "xpack.ml.use_auto_machine_memory_percent=true" docker.elastic.co/elasticsearch/elasticsearch:8.17.0
```

The command will output the **elastic user password** and an **enrollment token** for Kibana. These are displayed only when you start Elasticsearch for the first time.

### 1.6 Manage Credentials and SSL Certificates

- To regenerate the elastic password:

  ```bash
  docker exec -it es01 /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic
  ```

- To regenerate the Kibana enrollment token:

  ```bash
  docker exec -it es01 /usr/share/elasticsearch/bin/elasticsearch-create-enrollment-token -s kibana
  ```

- Store the password as an environment variable:

  ```bash
  export ELASTIC_PASSWORD="your_password"
  ```

- Copy the SSL certificate to your local machine:

  ```bash
  docker cp es01:/usr/share/elasticsearch/config/certs/http_ca.crt .
  ```

### 1.7 Verify Elasticsearch is Running

Make a REST API call to ensure Elasticsearch is running:

```bash
curl --cacert http_ca.crt -u elastic:$ELASTIC_PASSWORD https://localhost:9200
```

You should see a response with cluster details.

---

## Step 2: Setting Up the Node.js Application

### 2.1 Clone the Repository

Clone the project repository and navigate to the appropriate directory:

```bash
git clone https://github.com/Kominipaul/DeathRowSearch.git
cd DeathRowSearch
```

### 2.2 Ensure the SSL Certificate is Present

Make sure the `http_ca.crt` file is present in the root directory of the project. This certificate is necessary for secure communication with Elasticsearch.

### 2.3 Run the Application

Navigate to the `src` directory and start the application:

```bash
cd src
node app.js
```

And visit : http://localhost:3000/

The application will connect to Elasticsearch and start serving requests.

---


