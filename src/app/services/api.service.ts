import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'https://diariodebordodigital-production.up.railway.app';

  constructor(private http: HttpClient) {}

  // Helper method to get auth headers
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  signup(userData: {
    name: string;
    email: string;
    password: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, userData);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // ----------------------- Dashboard Related --------------------

  // Get user's aircraft
  getUserAircraft(): Observable<any> {
    return this.http.get(`${this.apiUrl}/aircraft`, this.getAuthHeaders());
  }

  // Add a new aircraft
  addAircraft(aircraftData: any): Observable<any> {
    console.log(aircraftData);
    return this.http.post(
      `${this.apiUrl}/aircraft/create`,
      aircraftData,
      this.getAuthHeaders()
    );
  }

  // Get aircraft responsible
  getAircraftResponsible(aircraft_id: any): Observable<any> {
    const options = {
      ...this.getAuthHeaders(),
      params: { aircraft_id },
    };
    return this.http.get(`${this.apiUrl}/aircraft/responsible`, options);
  }

  //delete aircraft
  deleteAircraft(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/aircraft/delete/${id}`,
      this.getAuthHeaders()
    );
  }

  // add a new responsible
  addResponsible(responsibleData: any): Observable<HttpResponse<any>> {
    return this.http.post<any>(
      `${this.apiUrl}/aircraft/responsible/create`,
      responsibleData,
      {
        ...this.getAuthHeaders().headers,
        observe: 'response',
      }
    );
  }

  // Update a responsible
  updateResponsible(
    id: number,
    data: { name: string; role: string; color: string }
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/aircraft/responsible/${id}`,
      data,
      this.getAuthHeaders()
    );
  }

  // Soft delete a responsible
  deleteResponsible(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/aircraft/responsible/${id}`,
      this.getAuthHeaders()
    );
  }

  // ---------------------Aircraft Related----------------------

  // add new flight
  addFlight(flightData: any): Observable<HttpResponse<any>> {
    return this.http.post<any>(
      `${this.apiUrl}/aircraft/flight/create`,
      flightData,
      {
        ...this.getAuthHeaders().headers,
        observe: 'response',
      }
    );
  }

  // Get year list for aircraft

  getYearList(aircraft_id: any): Observable<any> {
    const options = {
      ...this.getAuthHeaders(),
      params: { aircraft_id },
    };
    return this.http.get(`${this.apiUrl}/aircraft/flight/years`, options);
  }

  // Get flight list for aircraft

  getFlightList(
    aircraft_id: any,
    year: number,
    page: number,
    pageSize: number
  ): Observable<any> {
    const options = {
      ...this.getAuthHeaders(),
      params: { aircraft_id, year, page, pageSize },
    };
    return this.http.get(`${this.apiUrl}/aircraft/flight`, options);
  }

  // Get aircraft responsible and main Table

  getResponsibleSummary(aircraft_id: any, year: number): Observable<any> {
    const options = {
      ...this.getAuthHeaders(),
      params: { aircraft_id, year },
    };
    return this.http.get(`${this.apiUrl}/aircraft/responsible/table`, options);
  }

  // Update a flight
  updateFlight(id: number, flightData: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/aircraft/flight/${id}`,
      flightData,
      this.getAuthHeaders()
    );
  }

  // Soft delete a flight
  deleteFlight(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/aircraft/flight/${id}`,
      this.getAuthHeaders()
    );
  }

  // -------------------------------------cost related------------------------------------------------

  // Create a cost
  addCostAllocation(costData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/aircraft/flight/cost/create`,
      costData,
      this.getAuthHeaders()
    );
  }

  uploadReceipts(files: File[]): Observable<{ urls: string[] }> {
    const formData = new FormData();
    files.forEach((file) => formData.append('receipts', file));
    return this.http.post<{ urls: string[] }>(
      `${this.apiUrl}/aircraft/flight/cost/upload-receipts`,
      formData
    );
  }

  getCostAllocation(
    flight_id: number,
    responsible_id: number
  ): Observable<any> {
    return this.http.get(`${this.apiUrl}/aircraft/flight/cost/read`, {
      params: { flight_id, responsible_id },
      ...this.getAuthHeaders(),
    });
  }

  addIcaoCode(airport: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/aircraft/flight/icao/create`,
      airport,
      this.getAuthHeaders()
    );
  }

  getFavoriteIcaoCodes(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/aircraft/flight/icao/read`,
      this.getAuthHeaders()
    );
  }

  deleteIcaoCode(icao_code: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/aircraft/flight/icao/delete/${icao_code}`,
      this.getAuthHeaders()
    );
  }

  // -------------------------expenses----------------

  addPersonalExpense(expenseData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/aircraft/expenses/create`,
      expenseData,
      this.getAuthHeaders()
    );
  }

  getExpensesDisplay(aircraft_id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/aircraft/expenses/readDisplay`, {
      params: { aircraft_id },
      ...this.getAuthHeaders(),
    });
  }
}
