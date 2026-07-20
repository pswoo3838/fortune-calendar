import { CircularProgressLoader } from "./CircularProgressLoader";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return <CircularProgressLoader isLoading={true} message={message} />;
}

