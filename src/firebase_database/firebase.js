import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, push } from "firebase/database";  // Agrega set y push aquí

const firebaseConfig = {
  apiKey: "AIzaSyBeinn39dDuGTH-J3_0BKzDnxX1gYKTkCY",
  authDomain: "react-tecnologyview.firebaseapp.com",
  databaseURL: "https://react-tecnologyview-default-rtdb.firebaseio.com",
  projectId: "react-tecnologyview",
  storageBucket: "react-tecnologyview.firebasestorage.app",
  messagingSenderId: "906848551766",
  appId: "1:906848551766:web:bf066d7c4238afa2630cf7",
  measurementId: "G-JHR6S3KP7M"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, get, set, push };  // Asegúrate de exportar set y push
