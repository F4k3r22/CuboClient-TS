// test.ts
import { CuboClient } from './cuboClient';

async function runTest(): Promise<void> {
  console.log("Probando API CuboPago");

  const apiKey = "93aab3a749aa8da9";
  
  // URLs a probar
  const urlsToTry = [
    "https://api.cubo.com",
    "https://api.cubopago.com",
    "https://cubopago.com",
    "https://api-sandbox.cubopago.com",
    "https://sandbox.cubopago.com"
  ];
  
  // Datos de pago
  const paymentData = {
    clientName: "John Doe",
    clientEmail: "cliente@ejemplo.com",
    clientPhone: "+50322577777",
    description: "Test API",
    amount: 100, // Ya en centavos
    cardHolder: "John Doe",
    cardNumber: "4000000000000416",
    cvv: "123",
    month: "12",
    year: "26"
  };
  
  // Probar con la primera URL
  const client = new CuboClient(apiKey);
  const response = await client.pay(paymentData);
  const result = client.handleResponse(response);
  
  console.log("Resultado procesado:", result);
  
  // Probar con múltiples URLs
  console.log("\n\nProbando múltiples URLs...");
  await client.testMultipleUrls(paymentData, urlsToTry);
}

runTest().catch(error => console.error("Error en la prueba:", error));