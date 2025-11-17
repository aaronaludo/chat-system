import axios from 'axios';

const toError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const fallback = error.message || 'Unexpected error while communicating with the chat API';
    const detail = error.response?.data;
    if (!detail) {
      return new Error(fallback);
    }
    if (typeof detail === 'string') {
      return new Error(detail);
    }
    if (typeof detail === 'object' && detail !== null) {
      const detailObj = detail as Record<string, unknown>;
      if (typeof detailObj.detail === 'string') {
        return new Error(detailObj.detail);
      }
      if (typeof detailObj.message === 'string') {
        return new Error(detailObj.message);
      }
    }
    return new Error(fallback);
  }
  return error instanceof Error ? error : new Error('Unexpected error while communicating with the chat API');
};

export { toError };
