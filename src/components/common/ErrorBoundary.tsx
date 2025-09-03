import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // You could send error to monitoring service here
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">เกิดข้อผิดพลาดที่ไม่คาดคิด</h1>
            <p className="text-muted-foreground mb-4">โปรดลองรีโหลดหน้าอีกครั้ง</p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded" onClick={() => location.reload()}>
              รีโหลดหน้า
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

