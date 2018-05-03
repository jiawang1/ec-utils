import { ApolloLink } from 'apollo-link';
import Observable from 'zen-observable';

const createProgressLink = progresshandler => {
  const requests = [];
  let __hash = 0;
  const resolveRequest = requestHash => {
    requests.splice(requests.indexOf(requestHash), 1);
    if (requests.length === 0) {
      progresshandler.hide();
    }
  };
  return new ApolloLink((option, forward) => {
    const ob = forward(option);

    const requestHash = ++__hash;
    const { skipShowProgress } = option.getContext();

    if (!skipShowProgress) {
      if (requests.length === 0) {
        progresshandler.show();
      }
      requests.push(requestHash);
    }
    return new Observable(observer => {
      const observerErrorHandler = observer.error.bind(observer);
      const observerCompleteHandler = observer.complete.bind(observer);
      const observerNextHandler = observer.next.bind(observer);
      ob.subscribe({
        next: ({ data, errors }) => {
          observerNextHandler({
            data,
            errors
          });
        },
        error: err => {
          observerErrorHandler(err);
          if (!skipShowProgress) {
            resolveRequest(requestHash);
          }
        },
        complete: data => {
          observerCompleteHandler(data);
          if (!skipShowProgress) {
            resolveRequest(requestHash);
          }
        }
      });
    });
  });
};

export default createProgressLink;
