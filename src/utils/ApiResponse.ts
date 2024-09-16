class ApiResponse {
  statusCode: number;
  message: string;
  data: any;
  success: boolean;

  constructor(statusCode: number, message = "Success", data: object) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = true;
  }
}

export { ApiResponse };
