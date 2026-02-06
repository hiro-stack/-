

@admin.register(ApplicationEvent)
class ApplicationEventAdmin(admin.ModelAdmin):
    list_display = ['application', 'event_type', 'from_status', 'to_status', 'actor_type', 'created_at']
    list_filter = ['event_type', 'actor_type', 'created_at']
    search_fields = ['application__applicant__username', 'application__cat__name', 'note']
    readonly_fields = ['created_at']
