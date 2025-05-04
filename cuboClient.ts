// cuboClient.ts
import axios, { AxiosResponse, AxiosError } from 'axios';

// Definición de interfaces para los tipos
interface PaymentData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  description: string;
  amount: number;
  cardHolder: string;
  cardNumber: string;
  cvv: string;
  month: string;
  year: string;
  [key: string]: any; // Para permitir campos adicionales
}

interface ApiResponse {
  status?: string;
  referenceId?: string;
  authorizationCode?: string;
  processedAt?: string;
  statusCode?: number;
  message?: string;
  error?: string;
  details?: any;
}

interface ProcessedResponse {
  success: boolean;
  message?: string;
  reference_id?: string;
  authorization_code?: string;
  processed_at?: string;
}

interface TestResult {
  url: string;
  response?: ApiResponse;
  result?: ProcessedResponse;
  error?: string;
}

export class CuboClient {
  private apiKey: string;
  private url: string;
  private headers: Record<string, string>;

  /**
   * Constructor para el cliente de CuboPago
   * @param apiKey - API Key generada en Cubo Admin
   * @param url - URL base de la API (por defecto "https://api.cubo.com")
   */
  constructor(apiKey: string, url: string = "https://api.cubo.com") {
    this.apiKey = apiKey;
    this.url = url;
    this.headers = {
      'X-API-KEY': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Convierte dólares a centavos multiplicando por 100
   * @param amount - Monto en dólares
   * @returns - Monto en centavos
   */
  public convertCentv(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Procesa un pago utilizando la API de CuboPago
   * @param data - Datos del pago
   * @returns - Promesa con la respuesta de la API o error
   */
  public async pay(data: PaymentData | string): Promise<ApiResponse> {
    // Construir URL completa
    const endpoint: string = `${this.url}/api/v1/transactions`;
    
    // Asegurarse que data sea un objeto
    let paymentData: PaymentData;
    if (typeof data === 'string') {
      try {
        paymentData = JSON.parse(data) as PaymentData;
      } catch (e) {
        return { error: "Los datos proporcionados no son un JSON válido" };
      }
    } else {
      paymentData = { ...data };
    }
    
    // Convertir amount a centavos si es necesario
    if (paymentData.amount !== undefined && typeof paymentData.amount === 'number' && Number.isFinite(paymentData.amount)) {
      // Solo convertir si parece ser un número decimal (dólares)
      if (paymentData.amount % 1 !== 0) {
        paymentData.amount = this.convertCentv(paymentData.amount);
      }
    }
    
    try {
      // Información de depuración
      console.log(`URL: ${endpoint}`);
      console.log(`Headers:`, this.headers);
      console.log(`Datos:`, JSON.stringify(paymentData, null, 2));
      
      // Realizar la solicitud
      const response: AxiosResponse = await axios.post(endpoint, paymentData, { headers: this.headers });
      
      // Información de respuesta
      console.log(`Código de estado: ${response.status}`);
      console.log(`Respuesta:`, response.data);
      
      return response.data;
    } catch (error) {
      // Manejar errores de axios
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        console.log(`Código de estado: ${axiosError.response.status}`);
        console.log(`Respuesta:`, axiosError.response.data);
        return {
          error: `Error del servidor: ${axiosError.response.status}`,
          details: axiosError.response.data
        };
      } else if (axiosError.request) {
        // La solicitud se hizo pero no se recibió respuesta
        console.log(`Error: No se recibió respuesta`);
        return { error: "No se recibió respuesta del servidor" };
      } else {
        // Error al configurar la solicitud
        console.log(`Error:`, axiosError.message);
        return { error: `Error de conexión: ${axiosError.message}` };
      }
    }
  }

  /**
   * Procesa la respuesta de la API
   * @param response - Respuesta de la API
   * @returns - Información procesada
   */
  public handleResponse(response: ApiResponse): ProcessedResponse {
    // Verificar si hay error en la respuesta
    if (response.error) {
      return {
        success: false,
        message: response.error
      };
    }
    
    // Verificar respuesta exitosa de la API
    if (response.status === "SUCCEEDED") {
      return {
        success: true,
        reference_id: response.referenceId,
        authorization_code: response.authorizationCode,
        processed_at: response.processedAt
      };
    } else {
      return {
        success: false,
        message: response.message || "Error desconocido"
      };
    }
  }

  /**
   * Método para probar múltiples URLs
   * @param data - Datos del pago
   * @param urls - Lista de URLs a probar
   * @returns - Promesa con los resultados de las pruebas
   */
  public async testMultipleUrls(data: PaymentData, urls: string[]): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const url of urls) {
      console.log(`\n\nProbando con URL base: ${url}`);
      const client = new CuboClient(this.apiKey, url);
      
      try {
        const response = await client.pay(data);
        const result = client.handleResponse(response);
        
        results.push({
          url,
          response,
          result
        });
        
        console.log("Resultado procesado:", result);
      } catch (error) {
        results.push({
          url,
          error: (error as Error).message
        });
        
        console.log("Error:", (error as Error).message);
      }
      
      // Pequeña pausa para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }
}