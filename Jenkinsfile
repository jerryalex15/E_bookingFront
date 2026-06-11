pipeline {
    agent any

    tools {
        nodejs 'node20'    
    }
    
    environment {
        // On ajoute les chemins standards de macOS (/usr/local/bin et /opt/homebrew/bin pour les puces Apple Silicon)
        PATH = "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:${env.PATH}"
        DOCKER_IMAGE = 'nandraina/ebooking-frontend'
    }
    
    stages {        
        stage('Install dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Unit Tests') {
            steps {
                sh 'npm run test:ci'
            }
        }
        
        stage('Docker build'){
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${env.BUILD_NUMBER} -t ${DOCKER_IMAGE}:latest ."
            }
        }
        
        stage('Docker Push'){
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-secret', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    '''
                    
                    sh """
                        docker push ${DOCKER_IMAGE}:${env.BUILD_NUMBER}
                        docker push ${DOCKER_IMAGE}:latest
                        docker logout
                    """
                }
            }
        }
                
        stage('Trigger Deploy') {
            steps {
                build job: 'ebooking-pipeline-deploy', wait: true   // attend que le deploy soit fini
            }
        }
    }
}