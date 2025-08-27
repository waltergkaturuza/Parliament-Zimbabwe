# services/pdf.py
from weasyprint import HTML
from django.template.loader import render_to_string

def generate_handover_pdf(handover_id):
    handover = Handover.objects.get(id=handover_id)
    
    html_string = render_to_string(
        'handover_template.html',
        context={'handover': handover}
    )
    
    pdf_file = HTML(string=html_string).write_pdf()
    
    # Save to Azure Blob Storage
    blob_client = BlobClient.from_connection_string(
        conn_str=settings.AZURE_STORAGE_CONN_STRING,
        container_name="handovers",
        blob_name=f"handover_{handover_id}.pdf"
    )
    blob_client.upload_blob(pdf_file, overwrite=True)
    
    return blob_client.url