import Papa from 'papaparse';

function CsvReader(csvFile, setData) {
  Papa.parse(csvFile, {
    download: true,
    header: true,
    delimiter: ',',
    complete: function(results) {
      setData(results.data);
    }
  });
}

export default CsvReader;
