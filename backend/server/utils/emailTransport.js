const getErrorMessage = (error) => {
  if (!error) return "Unable to send email.";

  if (typeof error === "string") return error;

  if (error.message) return error.message;

  if (error.error?.message) return error.error.message;

  if (Array.isArray(error)) {
    const first = error.find((entry) => entry && entry.message);
    if (first?.message) return first.message;
  }

  return "Unable to send email.";
};

export const normalizeResendResult = (payload = {}) => {
  const responseError = payload?.error ?? payload?.response?.error ?? payload?.data?.error ?? null;
  const messageId = payload?.data?.id ?? payload?.data?.messageId ?? payload?.id ?? null;

  if (responseError) {
    return {
      success: false,
      code: "EMAIL_SEND_FAILED",
      message: getErrorMessage(responseError),
      provider: "resend",
      details: responseError,
    };
  }

  if (messageId) {
    return {
      success: true,
      code: "EMAIL_SENT",
      message: "Email sent successfully.",
      provider: "resend",
      messageId,
    };
  }

  return {
    success: false,
    code: "EMAIL_SEND_FAILED",
    message: "Unable to send email.",
    provider: "resend",
    details: payload,
  };
};
