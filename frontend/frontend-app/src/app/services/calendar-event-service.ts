import { Injectable } from '@angular/core';

import {

  HttpClient

} from '@angular/common/http';

import {

  Observable

} from 'rxjs';

import {

  CalendarEvent

} from '../models/calendar-event';

@Injectable({

  providedIn: 'root'

})
export class CalendarEventService {

  private apiUrl =
    'http://localhost:8000/api/calendar-events';

  constructor(

    private http: HttpClient

  ) {}

  getEvents():
  Observable<CalendarEvent[]> {

    return this.http.get<CalendarEvent[]>(

      this.apiUrl

    );

  }

  createEvent(

    event: Partial<CalendarEvent>

  ) {

    return this.http.post(

      this.apiUrl,

      event

    );

  }

  updateEvent(

    id: number,

    event: Partial<CalendarEvent>

  ) {

    return this.http.put(

      `${this.apiUrl}/${id}`,

      event

    );

  }

  deleteEvent(

    id: number

  ) {

    return this.http.delete(

      `${this.apiUrl}/${id}`

    );

  }

}