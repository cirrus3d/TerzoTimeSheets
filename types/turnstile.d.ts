// Cloudflare Turnstile type definitions
declare module '@marsidev/react-turnstile' {
  export interface TurnstileInstance {
    reset: () => void;
    remove: () => void;
    render: () => void;
    getResponse: () => string | undefined;
  }

  export interface TurnstileProps {
    siteKey: string;
    onSuccess?: (token: string) => void;
    onError?: () => void;
    onExpire?: () => void;
    onLoad?: () => void;
    action?: string;
    cData?: string;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
    tabIndex?: number;
    responseField?: boolean;
    responseFieldName?: string;
    retry?: 'auto' | 'never';
    retryInterval?: number;
    className?: string;
    id?: string;
  }

  export const Turnstile: React.ForwardRefExoticComponent<
    TurnstileProps & React.RefAttributes<TurnstileInstance>
  >;
}
