#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');


function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}


function installFirebaseCLI() {
  console.log('Instalando Firebase CLI...');
  try {
    execSync('npm install -g firebase-tools', { stdio: 'inherit' });
    console.log('Firebase CLI instalado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error instalando Firebase CLI:', error.message);
    return false;
  }
}


function setupFirebaseProject() {
  const firebaserc = {
    projects: {
      default: "mobile-1dae0"
    }
  };
  
  fs.writeFileSync('.firebaserc', JSON.stringify(firebaserc, null, 2));
  console.log('Archivo .firebaserc creado');
}


function createFirebaseConfig() {
  const firebaseConfig = {
    firestore: {
      rules: "firestore.rules"
    }
  };
  
  fs.writeFileSync('firebase.json', JSON.stringify(firebaseConfig, null, 2));
  console.log('Archivo firebase.json creado');
}


async function deployRules() {
  console.log('Configurando reglas de Firestore...\n');
  
  
  if (!checkFirebaseCLI()) {
    console.log('Firebase CLI no encontrado');
    if (!installFirebaseCLI()) {
      console.log('\nNo se pudo instalar Firebase CLI automáticamente.');
      console.log('Por favor, instálalo manualmente con: npm install -g firebase-tools');
      process.exit(1);
    }
  } else {
    console.log('Firebase CLI encontrado');
  }
  
  
  setupFirebaseProject();
  createFirebaseConfig();
  
  console.log('\nPasos para completar la configuración:');
  console.log('1. Ejecuta: firebase login');
  console.log('2. Ejecuta: firebase deploy --only firestore:rules');
  console.log('\nO usa el comando rápido: npm run deploy-rules');
  
  console.log('\nLas reglas permitirán:');
  console.log('- Lectura y escritura en la colección "usuarios"');
  console.log('- Acceso denegado a otras colecciones');
  console.log('\nIMPORTANTE: Estas reglas son para desarrollo.');
  console.log('En producción, deberías restringir el acceso con autenticación.');
}

deployRules().catch(console.error);