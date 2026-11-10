export const createClientMutationId = () => {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `m_${Date.now()}_${randomPart}`;
};
