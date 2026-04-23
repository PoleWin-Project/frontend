pipeline {
    agent any

    environment {
        IMAGE_NAME = 'polewin-frontend'
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
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        docker run --rm \
                        --network polewin_default \
                        --volumes-from jenkins \
                        -w "$WORKSPACE" \
                        -e SONAR_HOST_URL="$SONAR_HOST_URL" \
                        -e SONAR_TOKEN="$SONAR_AUTH_TOKEN" \
                        sonarsource/sonar-scanner-cli:latest \
                        sonar-scanner \
                            -Dsonar.projectKey=polewin-frontend \
                            -Dsonar.sources=app,components,lib,assets \
                            -Dsonar.inclusions=**/*.ts,**/*.tsx,**/*.js,**/*.jsx,**/*.css,**/*.scss,**/*.mdx \
                            -Dsonar.exclusions=**/node_modules/**,**/.expo/**,**/coverage/**,**/.git/**,**/dist/**,**/*.min.js \
                            -Dsonar.typescript.tsconfigPath=tsconfig.sonar.json \
                            -Dsonar.scm.provider=git
                    '''
                }
            }
        }

        stage('Trivy FS scan') {
            steps {
                sh '''
                    echo "=== Trivy FS scan (frontend workspace) ==="
                    docker run --rm \
                    --network polewin_default \
                    --volumes-from jenkins \
                    -w "$WORKSPACE" \
                    aquasec/trivy:0.69.3 fs \
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
                        docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy:0.69.3 image \
                            --severity HIGH,CRITICAL \
                            --exit-code 0 \
                            --no-progress \
                            --timeout 15m \
                            ${IMAGE_NAME}:${IMAGE_TAG}
                    """
                }
            }
        }
    }
}
