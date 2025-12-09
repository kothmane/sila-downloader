

console.log(process.env.NEXT_PUBLIC_BACKEND_URL);
export async function operation({collection, name, id = null, ids = [], data = {}, file = null, static_operation = false, token = null}) {

  // we need to determine the path and data
  // path depends on wether its static or not, file or not
  const path = process.env.NEXT_PUBLIC_BACKEND_URL + "/admin/vc" + (file ? "/form" : "") + (static_operation ? "/static" : "") + `/${collection}/${name}`;
  let data_ = {};
  if (file) {
    data_.file = file;
    data_.data = JSON.stringify(data);
  } else {
    data_.data = data;
  }

  if (!static_operation) {
    data_.ids = [...ids, ...(id ? [id] : [])];
  }

  if (file) {
    return await FORM({path, data: data_, token});
  } else {
    return await POST({path, data: data_, token});
  }
}

export async function POST({path, data = {}, token = null}) {

  let headers = {"Content-Type": "application/json"}
  if (token) {
    headers.Authorization =  `Bearer ${token}`
  }
  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  
  return await handleResponse(res);
}

export async function FORM({path, data = {}, token = null}) {

  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (Array.isArray(data[key])) {
      data[key].forEach(item => formData.append(key, item));
    } else {
      formData.append(key, data[key]);
    }
  });

  let headers = {};
  if (token) {
    headers.Authorization =  `Bearer ${token}`
  }
  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: formData
  });
  
  return await handleResponse(res);
}

async function handleResponse(res) {
  
  const ContentIsJson = res.headers.get('content-type').includes('application/json');
  
  if (ContentIsJson) {
    let body = null;
    try {
      body = await res.json();
    } catch (error) {
      body = null;
    }

    if (body) {
      if (res.ok) {
        return {ok: true, data: body};
      } else {
        return {ok: false, error: body.error};
      }
    } else {
      return {ok: false, error: "An error occurred"};
    }
  } else {
    if (res.ok) {
      return {ok: true, data: null};
    } else {
      return {ok: false, error: res.statusText};
    }
  } 
}

export const getPeriodInMongoFilterFormat = ({period, from, to}) => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case "today":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case "this_week":
      const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      firstDayOfWeek.setHours(0, 0, 0, 0);
      startDate = firstDayOfWeek;
      endDate = new Date(new Date(startDate).setDate(startDate.getDate() + 6));
      endDate.setHours(23, 59, 59, 999);
      break;
    case "this_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "custom_period":
      if (from && to) {
        startDate = new Date(from);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
      }
      break;
    case "anytime":
    default:
      return {};
  }

  if (startDate && endDate) {
    return { date: { $gte: startDate, $lte: endDate } };
  }




  
  return {};




};
