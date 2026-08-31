import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root',
})
export class Toast {
  messages = signal<ToastMessage[]>([]);
  private nextId = 0;

  show(text: string, type: ToastMessage['type'] = 'success') {
    const id = this.nextId++;
    this.messages.update((current) => [...current, { id, text, type }]);
    setTimeout(() => this.dismiss(id), 3500);
  }

  dismiss(id: number) {
    this.messages.update((current) => current.filter((m) => m.id !== id));
  }
}
