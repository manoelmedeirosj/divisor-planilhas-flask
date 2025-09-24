from flask import Flask, request, send_file, render_template
from flask_cors import CORS
import pandas as pd
import math
import os
import xlwt
import zipfile

app = Flask(__name__, template_folder='templates')
CORS(app)

UPLOAD_FOLDER = "backend/uploads"
OUTPUT_FOLDER = "backend/outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/calculo-avancado')
def calculo_avancado():
    return render_template('CalculoAvancadoExplicado.html')

@app.route('/consulta-moni')
def consulta_moni():
    return render_template('consultaMoni.html')
@app.route('/upload', methods=['POST'])
def upload():
    arquivos_gerados = []
    caminho_arquivo = ""
    zip_path = ""

    try:
        file = request.files['arquivo']
        linhas_por_arquivo = int(request.form['linhas'])
        caminho_arquivo = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(caminho_arquivo)

        df = pd.read_excel(caminho_arquivo, engine="xlrd").fillna("")
        total_linhas = len(df)
        num_arquivos = math.ceil(total_linhas / linhas_por_arquivo)

        for i in range(num_arquivos):
            parte = df.iloc[i * linhas_por_arquivo : (i + 1) * linhas_por_arquivo]
            nome_arquivo = f"parte_{i+1}.xls"
            caminho_saida = os.path.join(OUTPUT_FOLDER, nome_arquivo)

            wb = xlwt.Workbook()
            ws = wb.add_sheet("Dados")

            for col_index, col_name in enumerate(parte.columns):
                ws.write(0, col_index, col_name)

            for row_index, row in enumerate(parte.values):
                for col_index, value in enumerate(row):
                    ws.write(row_index + 1, col_index, value)

            wb.save(caminho_saida)
            arquivos_gerados.append(caminho_saida)

        zip_path = os.path.join(OUTPUT_FOLDER, "planilhas_divididas.zip")
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for caminho in arquivos_gerados:
                zipf.write(caminho, os.path.basename(caminho))

        return send_file(zip_path, as_attachment=True, mimetype='application/zip')

    except Exception as e:
        print("❌ Erro interno:", e)
        return f"Erro interno: {str(e)}", 500

    finally:
        for caminho in arquivos_gerados:
            if os.path.exists(caminho):
                os.remove(caminho)
        if caminho_arquivo and os.path.exists(caminho_arquivo):
            os.remove(caminho_arquivo)
        if zip_path and os.path.exists(zip_path):
            os.remove(zip_path)
    
    if __name__ == '__main__':
        app.run(debug=True)