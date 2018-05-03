# apollo-links

apollo async link supprots asynchronously communication with backend, both in troop query format or vanilla http request.

1. apollo-link-async: supports async request to backend. This link will translate graphql query language to troop query or just ajax request (for ajax request , resolver is needed).

One troop derective is provided for troop query case, **@troop**, it has following parameters:

- command: used to specify troop command for a graphql mutation.
- type: specify troop type. async link will use graphql type by default if no type derective is provided.
- id: this derective only used when supply data for a mutation. Since graphql mutation will always be expected to return data to optimize performance, but troop command does not supply results, if you want to return some data after mutation. If type is specified but no id , star ("*") is the default ID.

```code
  mutation updateEnrollment($templateId: String) {
    updateEnrollment(templateId: $templateId)
      @troop(
        type: "student_course_enrollment"
        id: "current"
        command: "school/enrollment/UpdateCurrentEnrollment"
      ) {
      id
      studentCourseId
      studentLevelId
      studentUnitId
      studentLessonId
    }
  }
```

2. apolloProgressLink: just used to show loading progress bar when remote request is on the fly. Method createProgressLink used to create this link expect a component with method show/hide as input param.
