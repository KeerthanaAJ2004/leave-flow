pipeline {
    agent any

    environment {
        IMAGE_NAME     = 'leave-manager'
        IMAGE_TAG      = "v${BUILD_NUMBER}"
        CONTAINER_NAME = 'leave-manager-app'
        APP_PORT       = '3000'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Cloning repository...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                bat 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running unit tests...'
                bat 'npm test -- --watchAll=false'
            }
        }

        stage('Code Quality') {
            steps {
                echo 'Running audit...'
                bat 'npm audit --audit-level=high || exit 0'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
                bat "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
                bat "docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest"
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying container...'
                // Stop and remove old container (ignore errors if not exists)
                bat "docker stop ${CONTAINER_NAME} || exit 0"
                bat "docker rm ${CONTAINER_NAME} || exit 0"
                // Start new container
                bat "docker run -d --name ${CONTAINER_NAME} -p ${APP_PORT}:3000 --restart unless-stopped ${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage('Health Check') {
            steps {
                echo 'Checking application health...'
                // Wait 8 seconds for container to start
                bat 'ping -n 9 127.0.0.1 > nul'
                bat "curl -f http://localhost:${APP_PORT}/health"
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded! Leave Manager deployed successfully.'
        }
        failure {
            echo 'Pipeline failed! Check logs.'
        }
        always {
            bat 'docker image prune -f || exit 0'
        }
    }
}