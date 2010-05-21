#!/usr/bin/env ruby

require 'rubygems'
require 'sinatra'
require 'json'

data = []
File.read( File.dirname(__FILE__) + '/randomdata.csv').each_line do | line |
    data << line.split('|')
end


get '/' do
    erb :index
end

get '/data.json' do
    content_type 'application/json'
    {  :rows=> data.sort_by{ rand }.slice(0...(params[:limit]||100).to_i ) }.to_json 
end
