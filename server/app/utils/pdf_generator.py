from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics import renderPDF
from io import BytesIO
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

def generate_analysis_pdf(analysis_data: Dict[str, Any]) -> bytes:
    """
    Tạo PDF báo cáo từ analysis data
    """
    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Get styles
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.darkblue
        )
        
        subheading_style = ParagraphStyle(
            'CustomSubHeading',
            parent=styles['Heading3'],
            fontSize=14,
            spaceAfter=8,
            textColor=colors.darkgreen
        )
        
        # Build content
        story = []
        
        # Title
        story.append(Paragraph("Báo Cáo Phân Tích Productivity", title_style))
        story.append(Spacer(1, 20))
        
        # Summary section
        story.append(Paragraph("Tổng Quan", heading_style))
        
        summary_data = [
            ['Chỉ số', 'Giá trị'],
            ['Tỷ lệ hoàn thành', f"{analysis_data.get('time', {}).get('completion_rate', 0):.1f}%"],
            ['Hiệu suất', f"{analysis_data.get('productivity', {}).get('efficiency_score', 0):.0f}/100"],
            ['Tasks/ngày', f"{analysis_data.get('productivity', {}).get('tasks_per_day', 0):.1f}"],
            ['Tổng todos phân tích', str(analysis_data.get('total_todos_analyzed', 0))],
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # Content Analysis
        content = analysis_data.get('content', {})
        if content:
            story.append(Paragraph("Phân Tích Nội Dung", heading_style))
            
            content_text = f"""
            <b>Chủ đề chính:</b> {content.get('category', 'N/A')}<br/>
            <b>Số lượng:</b> {content.get('count', 0)}<br/>
            <b>Xu hướng:</b> {content.get('trend', 'stable')}<br/>
            <b>Từ khóa:</b> {', '.join(content.get('keywords', []))}<br/>
            <b>Phần trăm:</b> {content.get('percentage', 0):.1f}%
            """
            story.append(Paragraph(content_text, styles['Normal']))
            story.append(Spacer(1, 12))
        
        # Time Analysis
        time_data = analysis_data.get('time', {})
        if time_data:
            story.append(Paragraph("Phân Tích Thời Gian", heading_style))
            
            time_text = f"""
            <b>Tỷ lệ hoàn thành:</b> {time_data.get('completion_rate', 0):.1f}%<br/>
            <b>Tỷ lệ quá hạn:</b> {time_data.get('overdue_rate', 0):.1f}%<br/>
            <b>Thời gian trung bình:</b> {time_data.get('avg_completion_time_hours', 0):.1f} giờ<br/>
            <b>Giờ làm việc hiệu quả:</b> {', '.join(map(str, time_data.get('peak_working_hours', [])))}<br/>
            <b>Xu hướng:</b> {time_data.get('trend', 'stable')}
            """
            story.append(Paragraph(time_text, styles['Normal']))
            story.append(Spacer(1, 12))
        
        # Productivity Analysis
        productivity = analysis_data.get('productivity', {})
        if productivity:
            story.append(Paragraph("Phân Tích Hiệu Suất", heading_style))
            
            productivity_text = f"""
            <b>Tasks mỗi ngày:</b> {productivity.get('tasks_per_day', 0):.1f}<br/>
            <b>Xu hướng hoàn thành:</b> {productivity.get('completion_trend', 'stable')}<br/>
            <b>Ngày hiệu quả:</b> {', '.join(productivity.get('peak_days', []))}<br/>
            <b>Điểm hiệu suất:</b> {productivity.get('efficiency_score', 0):.0f}/100
            """
            story.append(Paragraph(productivity_text, styles['Normal']))
            story.append(Spacer(1, 12))
        
        # Recommendations
        recommendations = analysis_data.get('recommendations', [])
        if recommendations:
            story.append(Paragraph("Gợi Ý Cải Thiện", heading_style))
            
            for i, rec in enumerate(recommendations, 1):
                priority_color = {
                    'high': 'red',
                    'medium': 'orange', 
                    'low': 'green'
                }.get(rec.get('priority', 'low'), 'black')
                
                rec_text = f"""
                <b>{i}. {rec.get('title', 'N/A')}</b><br/>
                <font color="{priority_color}">Ưu tiên: {rec.get('priority', 'low').upper()}</font><br/>
                {rec.get('description', 'N/A')}
                """
                story.append(Paragraph(rec_text, styles['Normal']))
                story.append(Spacer(1, 8))
        
        # Comparison (if available)
        comparison = analysis_data.get('comparison')
        if comparison:
            story.append(PageBreak())
            story.append(Paragraph("So Sánh Với Kỳ Trước", heading_style))
            
            comp_text = f"""
            <b>Thay đổi:</b> {comparison.get('change_percentage', 0):.1f}%<br/>
            <b>Lĩnh vực cải thiện:</b> {', '.join(comparison.get('improvement_areas', []))}<br/>
            <b>Lĩnh vực suy giảm:</b> {', '.join(comparison.get('declining_areas', []))}
            """
            story.append(Paragraph(comp_text, styles['Normal']))
        
        # Footer
        story.append(Spacer(1, 30))
        footer_text = f"""
        <i>Báo cáo được tạo tự động bởi AI Analysis System<br/>
        Thời gian tạo: {analysis_data.get('generated_at', 'N/A')}<br/>
        Độ tin cậy: {analysis_data.get('confidence_score', 0):.1f}%</i>
        """
        story.append(Paragraph(footer_text, styles['Normal']))
        
        # Build PDF
        doc.build(story)
        
        # Get PDF bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        logger.info("PDF generated successfully")
        return pdf_bytes
        
    except Exception as e:
        logger.error(f"Error generating PDF: {e}")
        raise

def create_simple_chart(data: Dict[str, float], chart_type: str = "bar") -> Drawing:
    """
    Tạo chart đơn giản cho PDF
    """
    try:
        drawing = Drawing(400, 200)
        
        if chart_type == "bar":
            chart = VerticalBarChart()
            chart.x = 50
            chart.y = 50
            chart.height = 125
            chart.width = 300
            chart.data = [list(data.values())]
            chart.categoryAxis.categoryNames = list(data.keys())
            drawing.add(chart)
        elif chart_type == "pie":
            chart = Pie()
            chart.x = 150
            chart.y = 50
            chart.width = 100
            chart.height = 100
            chart.data = list(data.values())
            chart.labels = list(data.keys())
            drawing.add(chart)
        
        return drawing
        
    except Exception as e:
        logger.error(f"Error creating chart: {e}")
        return Drawing(400, 200)  # Return empty drawing on error
