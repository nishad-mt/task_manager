from rest_framework.pagination import PageNumberPagination

class TaskPagination(PageNumberPagination):
    page_size = 3              # default items per page
    page_size_query_param = 'page_size'
    max_page_size = 100