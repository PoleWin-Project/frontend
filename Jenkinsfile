pipeline {
    agent any

    environment {
        IMAGE_NAME = 'polewin-frontend'
        SONAR_HOST_URL = 'http://sonarqube:9000'    
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build frontend') {
            steps {
                sh '''
                    npm ci || npm install
                    npm run build
                '''
            }
        }

    stage('SonarQube analysis') {
            steps {
                withCredentials([string(credentialsId: 'sonar-token-frontend', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        docker run --rm \
                        --network polewin_default \
                        --volumes-from jenkins \
                        -w "$WORKSPACE" \
                        -e SONAR_TOKEN="$SONAR_TOKEN" \
                        sonarsource/sonar-scanner-cli:latest \
                        sonar-scanner \
                            -Dsonar.projectKey=polewin-frontend \
                            -Dsonar.sources=app,components,lib,assets \
                            -Dsonar.inclusions=**/*.ts,**/*.tsx,**/*.js,**/*.jsx,**/*.css,**/*.scss,**/*.mdx \
                            -Dsonar.exclusions=**/node_modules/**,**/.expo/**,**/coverage/**,**/.git/**,**/dist/**,**/*.min.js \
                            -Dsonar.typescript.tsconfigPath=tsconfig.sonar.json \
                            -Dsonar.scm.provider=git \
                            -Dsonar.host.url=$SONAR_HOST_URL \
                            -Dsonar.token=$SONAR_TOKEN
                    '''
                }
            }
        }

        stage('Trivy FS scan') {
            steps {
                sh '''
                    echo "=== Trivy FS scan (frontend workspace) ==="
                    echo "Workspace path: $WORKSPACE"
                    ls -la "$WORKSPACE"

                    docker run --rm \
                    --network polewin_default \
                    --volumes-from jenkins \
                    -w "$WORKSPACE" \
                    aquasec/trivy:latest fs \
                        --scanners secret \
                        --skip-dirs .git,node_modules,.expo \
                        --exit-code 0 \
                        --no-progress \
                        "$WORKSPACE"
                '''
            }
        }


        stage('Build Docker image') {
            steps {
                script {
                    env.IMAGE_TAG = env.GIT_COMMIT.take(7)
                    sh "docker build -t ${IMAGE_NAME}:${env.IMAGE_TAG} ."
                }
            }
        }

        stage('Trivy image scan') {
            steps {
                script {
                    sh """
                        echo "=== Trivy image scan ==="
                        echo "Scanning image: ${IMAGE_NAME}:${IMAGE_TAG}"

                        docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy:latest image \
                            --severity HIGH,CRITICAL \
                            --exit-code 0 \
                            --no-progress \
                            ${IMAGE_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }
    }
}