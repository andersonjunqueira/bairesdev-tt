import axios from 'axios';
import fs from'fs';

const global = {};

const getHeaders = token => {
  return {
    'Authorization': `${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
}

const getDateParams = now => {
  const dtemp = new Date(now.getFullYear(), now.getUTCMonth()+1, 0);
  const year = dtemp.getFullYear();
  const month = dtemp.getUTCMonth()+1;
  const lastDay = dtemp.getDate();
  return { lastDay, month, year };
}

export const loadProjects = async (now, token) => {
  const date = getDateParams(now);
  const data = {
    employeeId: null,
    fromDate: `${date.year}-${date.month < 10 ? '0' : ''}${date.month}-01T00:00:00.000Z`,
    toDate: `${date.year}-${date.month < 10 ? '0' : ''}${date.month}-${date.lastDay}T23:59:59.999Z`
  }
  return await axios({
      method: 'put',
      url: 'https://employees.bairesdev.com/api/v1/employees/projects',
      headers: getHeaders(token),
      data
  }).then(resp => {
    return resp.data.data;
  }).catch(err => {
    console.log('ERROR!', line);
    return err;
  });
}

export const loadFocalPoints = async (now, token) => {
  const date = getDateParams(now);
  const data = {
    employeeId: null,
    fromDate: `${date.year}-${date.month < 10 ? '0' : ''}${date.month}-01T00:00:00.000Z`,
    toDate: `${date.year}-${date.month < 10 ? '0' : ''}${date.month}-${date.lastDay}T23:59:59.999Z`
  }
  return await axios({
      method: 'put',
      url: 'https://employees.bairesdev.com/api/v1/employees/focalpoints',
      headers: getHeaders(token),
      data
  }).then(resp => {
    return resp.data.data;
  }).catch(err => {
    console.log('ERROR!', line);
    return err;
  });
}

export const loadRecordTypes = async (token) => {
  const data = {
    employeeId: null,
  }
  return await axios({
      method: 'put',
      url: 'https://employees.bairesdev.com/api/v1/employees/recordtypes',
      headers: getHeaders(token),
      data
  }).then(resp => {
    return resp.data.data;
  }).catch(err => {
    console.log('ERROR!', line);
    return err;
  });
}

export const loadCategories = async (now, token) => {
  const date = getDateParams(now);
  const data = {
    employeeId: null,
    fromDate: `${date.year}-${date.month < 10 ? '0' : ''}${date.month}-01T00:00:00.000Z`,
    toDate: `${date.year}-${date.month < 10 ? '0' : ''}${date.month}-${date.lastDay}T23:59:59.999Z`
  }
  return await axios({
      method: 'put',
      url: 'https://employees.bairesdev.com/api/v1/employees/taskcategories',
      headers: getHeaders(token),
      data
  }).then(async resp => {

    for(let i =0; i < resp.data.data.length; i++) {
      const cat = resp.data.data[i];
      cat.tasks = await loadTaskDescriptions(cat.id, now, token);
    }

    return resp.data.data;

  }).catch(err => {
    console.log('ERROR!', line);
    return err;
  });
}

export const loadTaskDescriptions = async (categoryId, now, token) => {
  const date = getDateParams(now);
  const data = {
    categoryId,
    employeeId: null,
    fromDate: `${date.year}-${date.month < 10 ? '0' : ''}${date.month}-01T00:00:00.000Z`,
    toDate: null
  }
  return await axios({
      method: 'put',
      url: 'https://employees.bairesdev.com/api/v1/employees/taskdescriptions',
      headers: getHeaders(token),
      data
  }).then(resp => {
    return resp.data.data;
  }).catch(err => {
    console.log('ERROR!', line);
    return err;
  });
}

export const addTT = async (line, token) => {
  const fields = line.split('\t');
  const date = fields[0].split('/');
  
  const error = false;
  const local = {};

  console.log('PROCESSING LINE', line);

  local.project = global.projects.filter(p => p.name === fields[1]);
  if(local.project.length == 0) {
    console.log('ERROR!', 'INVALID PROJECT');
    error = true;
  }

  local.focalPoint = global.focalPoints.filter(f => fields[6].startsWith(f.name));
  if(local.focalPoint.length == 0) {
    console.log('ERROR!', 'INVALID FOCAL POINT');
    error = true;
  }

  local.category = global.categories.filter(c => c.name === fields[3]);
  if(local.category.length == 0) {
    console.log('ERROR!', 'INVALID CATEGORY');
    error = true;
  }
  
  local.description = local.category[0].tasks.filter(t => t.name === fields[4]);
  if(local.description.length == 0) {
    console.log('ERROR!', 'INVALID TASK');
    error = true;
  }
  
  local.recordType = global.recordTypes.filter(t => t.name === 'Regular hours');
  if(local.recordType.length == 0) {
    console.log('ERROR!', 'INVALID RECORD TYPE');
    error = true;
  }

  if(error) return;

  const payload = {
    employeeId: null,
    date: `${date[2]}-${date[1]}-${date[0]}T00:00:00.000Z`,
    projectId: local.project[0].id,
    descriptionId: local.description[0].id,
    hours: parseInt(fields[2]),
    comments: fields[5],
    focalPointId: local.focalPoint[0].id,
    recordTypeId: local.recordType[0].id
  };

  await axios({
    method: 'put',
    url: `https://employees.bairesdev.com/api/v1/employees/timetracker-record-upsert`,
    headers: getHeaders(token),
    data: payload
  }).then(resp => {
    console.log('SUCCESS!');
  }).catch(err => {
    console.log('ERROR!', line);
  });

}

const prepare = async (now, token) => {
  global.projects = await loadProjects(now, token);
  global.focalPoints = await loadFocalPoints(now, token);
  global.recordTypes = await loadRecordTypes(token);
  global.categories = await loadCategories(now, token);
}

export const loadTT = async (file, now, token) => {

  await prepare(now, token);

  fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
    } else {
      let lines = data.split('\n');
      for(let i = 0; i < lines.length; i++)
        if(lines[i].trim())
          addTT(lines[i]);
    }
  });
}
