"use client";

import * as React from "react";

type ToastVariant = "default" | "destructive" | "success";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

type Action =
  | { type: "ADD"; toast: Toast }
  | { type: "DISMISS"; toastId?: string }
  | { type: "REMOVE"; toastId?: string };

interface State {
  toasts: Toast[];
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "DISMISS":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          action.toastId === undefined || t.id === action.toastId
            ? { ...t }
            : t
        ),
      };
    case "REMOVE":
      return {
        ...state,
        toasts: action.toastId
          ? state.toasts.filter((t) => t.id !== action.toastId)
          : [],
      };
    default:
      return state;
  }
}

export function toast({
  title,
  description,
  variant = "default",
}: Omit<Toast, "id">) {
  const id = crypto.randomUUID();
  dispatch({ type: "ADD", toast: { id, title, description, variant } });
  setTimeout(() => dispatch({ type: "REMOVE", toastId: id }), TOAST_REMOVE_DELAY);
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);

  return { toasts: state.toasts, toast, dismiss: (id: string) => dispatch({ type: "REMOVE", toastId: id }) };
}
